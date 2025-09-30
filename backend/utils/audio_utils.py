"""
Audio processing utilities using pydub and librosa.
"""

import os
from typing import Dict, Optional

from pydub import AudioSegment

from backend.core.exceptions import AudioProcessingError, UnsupportedFormatError
from backend.core.logging import get_logger

logger = get_logger(__name__)


def get_audio_duration(file_path: str) -> float:
    """
    Get audio duration in seconds.

    Args:
        file_path: Path to audio file

    Returns:
        Duration in seconds

    Raises:
        AudioProcessingError: If duration cannot be determined
    """
    try:
        audio = AudioSegment.from_file(file_path)
        duration = len(audio) / 1000.0  # Convert milliseconds to seconds
        logger.debug("audio_duration_retrieved", file=file_path, duration=duration)
        return duration
    except Exception as e:
        raise AudioProcessingError(
            message=f"Failed to get audio duration: {str(e)}",
            file_path=file_path,
        )


def get_audio_metadata(file_path: str) -> Dict[str, any]:
    """
    Get audio file metadata.

    Args:
        file_path: Path to audio file

    Returns:
        Dictionary with metadata (duration, channels, sample_rate, bitrate)

    Raises:
        AudioProcessingError: If metadata cannot be read
    """
    try:
        audio = AudioSegment.from_file(file_path)
        metadata = {
            "duration": len(audio) / 1000.0,
            "channels": audio.channels,
            "sample_rate": audio.frame_rate,
            "sample_width": audio.sample_width,
            "frame_count": audio.frame_count(),
            "frame_width": audio.frame_width,
        }
        logger.debug("audio_metadata_retrieved", file=file_path, **metadata)
        return metadata
    except Exception as e:
        raise AudioProcessingError(
            message=f"Failed to get audio metadata: {str(e)}",
            file_path=file_path,
        )


def convert_audio_format(
    input_path: str,
    output_path: str,
    output_format: str,
    sample_rate: Optional[int] = None,
    bitrate: Optional[str] = None,
) -> str:
    """
    Convert audio file to different format.

    Args:
        input_path: Path to input audio file
        output_path: Path for output file
        output_format: Target format (wav, mp3, flac)
        sample_rate: Target sample rate (None to keep original)
        bitrate: Target bitrate for compressed formats (e.g., "192k")

    Returns:
        Path to converted file

    Raises:
        AudioProcessingError: If conversion fails
        UnsupportedFormatError: If format is not supported
    """
    supported_formats = ["wav", "mp3", "flac", "ogg", "m4a"]
    if output_format not in supported_formats:
        raise UnsupportedFormatError(
            filename=os.path.basename(input_path),
            format=output_format,
            supported_formats=supported_formats,
        )

    try:
        audio = AudioSegment.from_file(input_path)

        # Resample if requested
        if sample_rate and audio.frame_rate != sample_rate:
            audio = audio.set_frame_rate(sample_rate)
            logger.debug("audio_resampled", sample_rate=sample_rate)

        # Export with format-specific parameters
        export_params = {"format": output_format}
        if bitrate and output_format in ["mp3", "ogg"]:
            export_params["bitrate"] = bitrate

        audio.export(output_path, **export_params)

        logger.info(
            "audio_converted",
            input=input_path,
            output=output_path,
            format=output_format,
            sample_rate=sample_rate,
            bitrate=bitrate,
        )
        return output_path

    except Exception as e:
        raise AudioProcessingError(
            message=f"Failed to convert audio: {str(e)}",
            input_path=input_path,
            output_format=output_format,
        )


def normalize_audio(input_path: str, output_path: str, target_dbfs: float = -20.0) -> str:
    """
    Normalize audio to target loudness.

    Args:
        input_path: Path to input audio file
        output_path: Path for output file
        target_dbfs: Target loudness in dBFS

    Returns:
        Path to normalized file

    Raises:
        AudioProcessingError: If normalization fails
    """
    try:
        audio = AudioSegment.from_file(input_path)

        # Calculate change needed to reach target
        change_in_dbfs = target_dbfs - audio.dBFS
        normalized_audio = audio.apply_gain(change_in_dbfs)

        # Export normalized audio
        normalized_audio.export(output_path, format=output_path.split(".")[-1])

        logger.info(
            "audio_normalized",
            input=input_path,
            output=output_path,
            original_dbfs=audio.dBFS,
            target_dbfs=target_dbfs,
            gain_applied=change_in_dbfs,
        )
        return output_path

    except Exception as e:
        raise AudioProcessingError(
            message=f"Failed to normalize audio: {str(e)}",
            input_path=input_path,
        )


def validate_audio_channels(file_path: str, max_channels: int = 2) -> None:
    """
    Validate audio channel count.

    Args:
        file_path: Path to audio file
        max_channels: Maximum allowed channels

    Raises:
        AudioProcessingError: If channel count exceeds maximum
    """
    try:
        audio = AudioSegment.from_file(file_path)
        if audio.channels > max_channels:
            raise AudioProcessingError(
                message=f"Audio has {audio.channels} channels, maximum {max_channels} allowed",
                file_path=file_path,
                channels=audio.channels,
                max_channels=max_channels,
            )
    except Exception as e:
        if isinstance(e, AudioProcessingError):
            raise
        raise AudioProcessingError(
            message=f"Failed to validate audio channels: {str(e)}",
            file_path=file_path,
        )


def get_audio_format(file_path: str) -> str:
    """
    Detect audio format from file.

    Args:
        file_path: Path to audio file

    Returns:
        Audio format (wav, mp3, etc.)

    Raises:
        AudioProcessingError: If format cannot be detected
    """
    try:
        # Try to load file and detect format
        audio = AudioSegment.from_file(file_path)

        # Use file extension as format
        format_from_ext = os.path.splitext(file_path)[1].lstrip(".").lower()

        logger.debug("audio_format_detected", file=file_path, format=format_from_ext)
        return format_from_ext

    except Exception as e:
        raise AudioProcessingError(
            message=f"Failed to detect audio format: {str(e)}",
            file_path=file_path,
        )


def convert_to_mono(input_path: str, output_path: str) -> str:
    """
    Convert stereo audio to mono.

    Args:
        input_path: Path to input audio file
        output_path: Path for output file

    Returns:
        Path to mono audio file

    Raises:
        AudioProcessingError: If conversion fails
    """
    try:
        audio = AudioSegment.from_file(input_path)

        if audio.channels == 1:
            # Already mono, just copy
            import shutil

            shutil.copy2(input_path, output_path)
            logger.debug("audio_already_mono", file=input_path)
        else:
            # Convert to mono
            mono_audio = audio.set_channels(1)
            mono_audio.export(output_path, format=output_path.split(".")[-1])
            logger.info("audio_converted_to_mono", input=input_path, output=output_path)

        return output_path

    except Exception as e:
        raise AudioProcessingError(
            message=f"Failed to convert to mono: {str(e)}",
            input_path=input_path,
        )