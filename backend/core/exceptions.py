"""
Custom exception hierarchy for domain-specific errors.

All exceptions include error codes and HTTP status mappings.
"""

from typing import Any, Dict, Optional


class DemucsException(Exception):
    """Base exception for all Demucs-related errors."""

    def __init__(
        self,
        message: str,
        error_code: str,
        status_code: int = 500,
        context: Optional[Dict[str, Any]] = None,
    ):
        """
        Initialize exception.

        Args:
            message: Human-readable error message
            error_code: Machine-readable error code
            status_code: HTTP status code
            context: Additional error context
        """
        super().__init__(message)
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.context = context or {}

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary for API response."""
        return {
            "error": {
                "code": self.error_code,
                "message": self.message,
                "status_code": self.status_code,
                "context": self.context,
            }
        }


class ValidationError(DemucsException):
    """Input validation errors."""

    def __init__(self, message: str, context: Optional[Dict[str, Any]] = None):
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=400,
            context=context,
        )


class FileValidationError(ValidationError):
    """File validation specific errors."""

    def __init__(self, message: str, filename: str, **context):
        super().__init__(
            message=message,
            context={"filename": filename, **context},
        )


class FileTooLargeError(FileValidationError):
    """File exceeds size limit."""

    def __init__(self, filename: str, size: int, max_size: int):
        super().__init__(
            message=f"File {filename} exceeds maximum size of {max_size / 1024 / 1024:.1f}MB",
            filename=filename,
            size_bytes=size,
            max_size_bytes=max_size,
        )


class UnsupportedFormatError(FileValidationError):
    """Unsupported audio format."""

    def __init__(self, filename: str, format: str, supported_formats: list[str]):
        super().__init__(
            message=f"Format '{format}' not supported. Supported: {', '.join(supported_formats)}",
            filename=filename,
            format=format,
            supported_formats=supported_formats,
        )


class AudioTooLongError(ValidationError):
    """Audio duration exceeds limit."""

    def __init__(self, duration: float, max_duration: float):
        super().__init__(
            message=f"Audio duration {duration:.1f}s exceeds maximum of {max_duration}s",
            context={"duration_seconds": duration, "max_duration_seconds": max_duration},
        )


class DemucsProcessingError(DemucsException):
    """Demucs processing errors."""

    def __init__(self, message: str, job_id: Optional[str] = None, **context):
        super().__init__(
            message=message,
            error_code="DEMUCS_PROCESSING_ERROR",
            status_code=500,
            context={"job_id": job_id, **context} if job_id else context,
        )


class ModelLoadError(DemucsProcessingError):
    """Failed to load Demucs model."""

    def __init__(self, model_name: str, reason: str):
        super().__init__(
            message=f"Failed to load model '{model_name}': {reason}",
            model=model_name,
            reason=reason,
        )


class StemSeparationError(DemucsProcessingError):
    """Stem separation failed."""

    def __init__(self, job_id: str, reason: str):
        super().__init__(
            message=f"Stem separation failed: {reason}",
            job_id=job_id,
            reason=reason,
        )


class YouTubeDownloadError(DemucsException):
    """YouTube download errors."""

    def __init__(self, message: str, url: str, **context):
        super().__init__(
            message=message,
            error_code="YOUTUBE_DOWNLOAD_ERROR",
            status_code=400,
            context={"url": url, **context},
        )


class VideoNotFoundError(YouTubeDownloadError):
    """YouTube video not found or unavailable."""

    def __init__(self, url: str):
        super().__init__(
            message=f"Video not found or unavailable: {url}",
            url=url,
        )


class VideoTooLongError(YouTubeDownloadError):
    """YouTube video too long."""

    def __init__(self, url: str, duration: float, max_duration: float):
        super().__init__(
            message=f"Video duration {duration:.1f}s exceeds maximum of {max_duration}s",
            url=url,
            duration_seconds=duration,
            max_duration_seconds=max_duration,
        )


class JobQueueError(DemucsException):
    """Job queue errors."""

    def __init__(self, message: str, **context):
        super().__init__(
            message=message,
            error_code="JOB_QUEUE_ERROR",
            status_code=500,
            context=context,
        )


class JobNotFoundError(DemucsException):
    """Job not found in queue."""

    def __init__(self, job_id: str):
        super().__init__(
            message=f"Job not found: {job_id}",
            error_code="JOB_NOT_FOUND",
            status_code=404,
            context={"job_id": job_id},
        )


class RateLimitExceededError(DemucsException):
    """Rate limit exceeded."""

    def __init__(self, limit: int, period: int, retry_after: int):
        super().__init__(
            message=f"Rate limit exceeded: {limit} requests per {period}s. Try again in {retry_after}s.",
            error_code="RATE_LIMIT_EXCEEDED",
            status_code=429,
            context={
                "limit": limit,
                "period_seconds": period,
                "retry_after_seconds": retry_after,
            },
        )


class AudioProcessingError(DemucsException):
    """Generic audio processing errors."""

    def __init__(self, message: str, **context):
        super().__init__(
            message=message,
            error_code="AUDIO_PROCESSING_ERROR",
            status_code=500,
            context=context,
        )