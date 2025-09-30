"""
FastAPI middleware for logging, request tracking, and CORS.
"""

import time
import uuid
from typing import Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware

from backend.core.config import get_config
from backend.core.logging import get_logger, log_request, log_response
from backend.core.observability import record_api_request

logger = get_logger(__name__)
config = get_config()


class RequestIDMiddleware(BaseHTTPMiddleware):
    """Middleware to add request ID to all requests."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Add request ID and track request/response.

        Args:
            request: Incoming request
            call_next: Next middleware/handler

        Returns:
            Response with request ID header
        """
        # Generate request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        # Log request
        log_request(
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            client_ip=request.client.host if request.client else "unknown",
        )

        # Process request
        start_time = time.time()

        try:
            response = await call_next(request)
            duration_ms = (time.time() - start_time) * 1000

            # Add request ID to response headers
            response.headers["X-Request-ID"] = request_id

            # Log response
            log_response(
                request_id=request_id,
                status_code=response.status_code,
                duration_ms=duration_ms,
            )

            # Record metrics
            record_api_request(
                method=request.method,
                endpoint=request.url.path,
                status_code=response.status_code,
                duration_seconds=duration_ms / 1000,
            )

            return response

        except Exception as e:
            duration_ms = (time.time() - start_time) * 1000

            logger.error(
                "request_error",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                error=str(e),
                duration_ms=duration_ms,
                exc_info=True,
            )

            # Record error metrics
            record_api_request(
                method=request.method,
                endpoint=request.url.path,
                status_code=500,
                duration_seconds=duration_ms / 1000,
            )

            raise


class LoggingMiddleware(BaseHTTPMiddleware):
    """Middleware for detailed request/response logging."""

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Log request and response details.

        Args:
            request: Incoming request
            call_next: Next middleware/handler

        Returns:
            Response
        """
        # Get request ID from state
        request_id = getattr(request.state, "request_id", "unknown")

        # Log request details
        logger.debug(
            "request_details",
            request_id=request_id,
            method=request.method,
            url=str(request.url),
            headers=dict(request.headers),
            query_params=dict(request.query_params),
        )

        response = await call_next(request)

        # Log response details
        logger.debug(
            "response_details",
            request_id=request_id,
            status_code=response.status_code,
            headers=dict(response.headers),
        )

        return response


def setup_middleware(app: FastAPI) -> None:
    """
    Configure all middleware for the application.

    Args:
        app: FastAPI application instance
    """
    # CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.api.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID"],
    )

    # Custom middleware
    app.add_middleware(RequestIDMiddleware)

    if config.debug:
        app.add_middleware(LoggingMiddleware)

    logger.info(
        "middleware_configured",
        cors_origins=config.api.cors_origins,
        debug=config.debug,
    )