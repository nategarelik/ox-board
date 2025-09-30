"""
Structured logging configuration using structlog.

Production-ready logging with JSON output, request tracking,
and performance monitoring integration.
"""

import logging
import sys
from typing import Any, Dict, Optional

import structlog
from pythonjsonlogger import jsonlogger


def setup_logging(
    log_level: str = "INFO",
    json_logs: bool = True,
    enable_performance_tracking: bool = True
) -> None:
    """
    Configure structured logging for the application.

    Args:
        log_level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
        json_logs: If True, output JSON formatted logs (production)
        enable_performance_tracking: Enable performance metrics logging
    """
    # Configure standard logging
    logging.basicConfig(
        format="%(message)s",
        stream=sys.stdout,
        level=getattr(logging, log_level.upper()),
    )

    # Structlog processors
    processors = [
        structlog.stdlib.filter_by_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
    ]

    if json_logs:
        # Production: JSON output
        processors.append(structlog.processors.JSONRenderer())
    else:
        # Development: Human-readable output
        processors.append(structlog.dev.ConsoleRenderer())

    structlog.configure(
        processors=processors,
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        wrapper_class=structlog.stdlib.BoundLogger,
        cache_logger_on_first_use=True,
    )


def get_logger(name: str) -> structlog.BoundLogger:
    """
    Get a structured logger instance.

    Args:
        name: Logger name (typically __name__)

    Returns:
        Configured structlog logger
    """
    return structlog.get_logger(name)


class PerformanceLogger:
    """
    Context manager for logging operation performance.

    Usage:
        with PerformanceLogger("stem_separation", job_id=job.id):
            result = separate_stems(audio_path)
    """

    def __init__(self, operation: str, **context: Any):
        """
        Initialize performance logger.

        Args:
            operation: Name of the operation being timed
            **context: Additional context to include in logs
        """
        self.operation = operation
        self.context = context
        self.logger = get_logger(__name__)
        self.start_time: Optional[float] = None

    def __enter__(self) -> "PerformanceLogger":
        """Start timing the operation."""
        import time
        self.start_time = time.time()
        self.logger.info(
            f"{self.operation}_started",
            operation=self.operation,
            **self.context
        )
        return self

    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Log operation completion with duration."""
        import time
        duration = time.time() - self.start_time if self.start_time else 0

        if exc_type is None:
            self.logger.info(
                f"{self.operation}_completed",
                operation=self.operation,
                duration_seconds=duration,
                duration_ms=duration * 1000,
                status="success",
                **self.context
            )
        else:
            self.logger.error(
                f"{self.operation}_failed",
                operation=self.operation,
                duration_seconds=duration,
                duration_ms=duration * 1000,
                status="error",
                error_type=exc_type.__name__,
                error_message=str(exc_val),
                **self.context
            )


def log_request(
    request_id: str,
    method: str,
    path: str,
    **context: Any
) -> None:
    """
    Log HTTP request with context.

    Args:
        request_id: Unique request identifier
        method: HTTP method
        path: Request path
        **context: Additional context (user_id, ip_address, etc.)
    """
    logger = get_logger(__name__)
    logger.info(
        "http_request",
        request_id=request_id,
        method=method,
        path=path,
        **context
    )


def log_response(
    request_id: str,
    status_code: int,
    duration_ms: float,
    **context: Any
) -> None:
    """
    Log HTTP response with timing.

    Args:
        request_id: Unique request identifier
        status_code: HTTP status code
        duration_ms: Request duration in milliseconds
        **context: Additional context
    """
    logger = get_logger(__name__)
    logger.info(
        "http_response",
        request_id=request_id,
        status_code=status_code,
        duration_ms=duration_ms,
        duration_seconds=duration_ms / 1000,
        **context
    )


def log_job_event(
    job_id: str,
    event: str,
    status: str,
    **context: Any
) -> None:
    """
    Log job processing event.

    Args:
        job_id: Job identifier
        event: Event type (created, started, completed, failed)
        status: Job status
        **context: Additional context (model, progress, etc.)
    """
    logger = get_logger(__name__)
    logger.info(
        f"job_{event}",
        job_id=job_id,
        event=event,
        status=status,
        **context
    )


def log_error(
    error: Exception,
    context: Optional[Dict[str, Any]] = None,
    **kwargs: Any
) -> None:
    """
    Log error with full context and stack trace.

    Args:
        error: Exception instance
        context: Error context dictionary
        **kwargs: Additional key-value pairs
    """
    logger = get_logger(__name__)

    error_context = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        **(context or {}),
        **kwargs
    }

    logger.error(
        "error_occurred",
        **error_context,
        exc_info=True
    )


# Example usage patterns
if __name__ == "__main__":
    # Setup for development
    setup_logging(log_level="DEBUG", json_logs=False)

    logger = get_logger(__name__)

    # Basic logging
    logger.info("application_started", version="1.0.0")

    # Structured context
    logger.info(
        "demucs_processing_started",
        job_id="job-123",
        model="htdemucs",
        input_size_mb=42.5,
        estimated_duration_sec=120
    )

    # Performance tracking
    with PerformanceLogger("stem_separation", job_id="job-123", model="htdemucs"):
        import time
        time.sleep(0.1)  # Simulate work

    # Error logging
    try:
        raise ValueError("Invalid audio format")
    except ValueError as e:
        log_error(e, context={"job_id": "job-123", "file": "audio.mp3"})

    logger.info("application_stopped")