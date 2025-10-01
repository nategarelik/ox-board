"""
Main FastAPI application entry point.

Production-ready Demucs backend with observability, logging, and error handling.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.responses import JSONResponse

from backend.api.middleware import setup_middleware
from backend.api.routes import router
from backend.core.config import get_config
from backend.core.exceptions import DemucsException
from backend.core.logging import get_logger, setup_logging
from backend.core.observability import setup_prometheus, setup_tracing

config = get_config()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager.

    Handles startup and shutdown tasks.

    Args:
        app: FastAPI application
    """
    # Startup
    logger.info(
        "application_starting",
        name=config.app_name,
        version=config.version,
        environment=config.environment,
    )

    # Setup logging
    setup_logging(
        log_level=config.log_level,
        json_logs=config.json_logs,
    )

    # Setup observability
    if config.observability.enable_tracing:
        setup_prometheus(port=config.observability.prometheus_port)
        setup_tracing(
            service_name=config.app_name,
            otlp_endpoint=config.observability.otlp_endpoint,
        )

    logger.info("application_started")

    yield

    # Shutdown
    logger.info("application_shutting_down")


# Create FastAPI application
app = FastAPI(
    title=config.app_name,
    version=config.version,
    description="Self-hosted Demucs stem separation backend",
    lifespan=lifespan,
    docs_url="/docs" if config.debug else None,
    redoc_url="/redoc" if config.debug else None,
)

# Setup middleware
setup_middleware(app)

# Include routes
app.include_router(router, prefix="/api/v1")


# Exception handler for DemucsException
@app.exception_handler(DemucsException)
async def demucs_exception_handler(request, exc: DemucsException):
    """
    Handle DemucsException globally.

    Args:
        request: Request object
        exc: DemucsException instance

    Returns:
        JSONResponse with error details
    """
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
    )


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": config.app_name,
        "version": config.version,
        "environment": config.environment,
        "docs": "/docs" if config.debug else None,
    }


if __name__ == "__main__":
    import uvicorn
    import os

    # Get port from environment (Railway sets PORT)
    port = int(os.getenv("PORT", config.port))

    uvicorn.run(
        "main:app",
        host=config.host,
        port=port,
        reload=config.debug,
        log_level=config.log_level.lower(),
    )