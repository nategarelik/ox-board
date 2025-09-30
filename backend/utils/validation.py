"""
Input validation utilities for files, URLs, and audio.
"""

import os
import re
from typing import Optional
from urllib.parse import parse_qs, urlparse

from backend.core.config import get_config
from backend.core.exceptions import (
    AudioTooLongError,
    FileTooLargeError,
    FileValidationError,
    UnsupportedFormatError,
    ValidationError,
)
from backend.core.logging import get_logger
from backend.utils.audio_utils import get_audio_duration, get_audio_metadata
from backend.utils.file_utils import get_file_size

logger = get_logger(__name__)
config = get_config()


def validate_file_size(file_path: str, max_size: Optional[int] = None) -> None:
    """
    Validate file size is within limits.

    Args:
        file_path: Path to file
        max_size: Maximum size in bytes (None uses config default)

    Raises:
        FileTooLargeError: If file exceeds size limit
    """
    max_size = max_size or config.demucs.max_file_size
    file_size = get_file_size(file_path)

    if file_size > max_size:
        raise FileTooLargeError(
            filename=os.path.basename(file_path),
            size=file_size,
            max_size=max_size,
        )

    logger.debug(
        "file_size_validated",
        file=file_path,
        size_mb=file_size / 1024 / 1024,
        limit_mb=max_size / 1024 / 1024,
    )


def validate_audio_format(file_path: str) -> str:
    """
    Validate audio file format is supported.

    Args:
        file_path: Path to audio file

    Returns:
        Detected audio format

    Raises:
        UnsupportedFormatError: If format is not supported
    """
    supported_formats = ["mp3", "wav", "m4a", "flac", "ogg"]
    extension = os.path.splitext(file_path)[1].lstrip(".").lower()

    if extension not in supported_formats:
        raise UnsupportedFormatError(
            filename=os.path.basename(file_path),
            format=extension,
            supported_formats=supported_formats,
        )

    logger.debug("audio_format_validated", file=file_path, format=extension)
    return extension


def validate_audio_duration(
    file_path: str,
    max_duration: Optional[int] = None,
) -> float:
    """
    Validate audio duration is within limits.

    Args:
        file_path: Path to audio file
        max_duration: Maximum duration in seconds (None uses config default)

    Returns:
        Audio duration in seconds

    Raises:
        AudioTooLongError: If duration exceeds limit
    """
    max_duration = max_duration or config.demucs.max_duration
    duration = get_audio_duration(file_path)

    if duration > max_duration:
        raise AudioTooLongError(
            duration=duration,
            max_duration=float(max_duration),
        )

    logger.debug(
        "audio_duration_validated",
        file=file_path,
        duration=duration,
        max_duration=max_duration,
    )
    return duration


def validate_audio_file(file_path: str) -> dict:
    """
    Perform comprehensive audio file validation.

    Args:
        file_path: Path to audio file

    Returns:
        Dictionary with validation results and metadata

    Raises:
        FileValidationError: If file is invalid
        FileTooLargeError: If file exceeds size limit
        UnsupportedFormatError: If format is not supported
        AudioTooLongError: If duration exceeds limit
    """
    # Check file exists
    if not os.path.exists(file_path):
        raise FileValidationError(
            message="File does not exist",
            filename=os.path.basename(file_path),
        )

    # Validate size
    validate_file_size(file_path)

    # Validate format
    audio_format = validate_audio_format(file_path)

    # Validate duration
    duration = validate_audio_duration(file_path)

    # Get metadata
    metadata = get_audio_metadata(file_path)

    logger.info(
        "audio_file_validated",
        file=file_path,
        format=audio_format,
        duration=duration,
        size_mb=get_file_size(file_path) / 1024 / 1024,
    )

    return {
        "valid": True,
        "format": audio_format,
        "duration": duration,
        "metadata": metadata,
    }


def validate_youtube_url(url: str) -> dict:
    """
    Validate YouTube URL format and extract video ID.

    Args:
        url: YouTube URL to validate

    Returns:
        Dictionary with video_id and url

    Raises:
        ValidationError: If URL is invalid
    """
    # YouTube URL patterns
    patterns = [
        r"(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})",
        r"(?:https?:\/\/)?(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})",
        r"(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})",
    ]

    video_id = None
    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            video_id = match.group(1)
            break

    if not video_id:
        raise ValidationError(
            message="Invalid YouTube URL format",
            context={"url": url},
        )

    logger.debug("youtube_url_validated", url=url, video_id=video_id)

    return {
        "valid": True,
        "video_id": video_id,
        "url": url,
    }


def validate_model_name(model: str) -> None:
    """
    Validate Demucs model name is supported.

    Args:
        model: Model name to validate

    Raises:
        ValidationError: If model is not supported
    """
    valid_models = ["htdemucs", "htdemucs_ft", "mdx_extra", "mdx_extra_q"]

    if model not in valid_models:
        raise ValidationError(
            message=f"Model '{model}' not supported",
            context={
                "model": model,
                "valid_models": valid_models,
            },
        )

    logger.debug("model_name_validated", model=model)


def validate_output_format(format: str) -> None:
    """
    Validate output audio format is supported.

    Args:
        format: Output format to validate

    Raises:
        ValidationError: If format is not supported
    """
    valid_formats = ["wav", "mp3", "flac"]

    if format not in valid_formats:
        raise ValidationError(
            message=f"Output format '{format}' not supported",
            context={
                "format": format,
                "valid_formats": valid_formats,
            },
        )

    logger.debug("output_format_validated", format=format)