"""
YouTube download service using yt-dlp.

Handles YouTube video downloads with validation and conversion.
"""

import os
import subprocess
from typing import Dict

from backend.core.config import get_config
from backend.core.exceptions import (
    VideoNotFoundError,
    VideoTooLongError,
    YouTubeDownloadError,
)
from backend.core.logging import PerformanceLogger, get_logger
from backend.core.observability import traced
from backend.utils.file_utils import create_temp_directory, ensure_directory_exists
from backend.utils.validation import validate_youtube_url

logger = get_logger(__name__)
config = get_config()


class YouTubeService:
    """Service for downloading audio from YouTube."""

    def __init__(self):
        """Initialize YouTube service."""
        self.download_dir = config.youtube.download_dir
        self.max_duration = config.youtube.max_duration
        self.format = config.youtube.format

        # Ensure download directory exists
        ensure_directory_exists(self.download_dir)

        logger.info(
            "youtube_service_initialized",
            download_dir=self.download_dir,
            max_duration=self.max_duration,
        )

    @traced("download_youtube_audio")
    def download_audio(self, url: str, job_id: str) -> str:
        """
        Download audio from YouTube URL.

        Args:
            url: YouTube URL
            job_id: Job identifier for logging

        Returns:
            Path to downloaded audio file

        Raises:
            YouTubeDownloadError: If download fails
            VideoNotFoundError: If video not found
            VideoTooLongError: If video exceeds duration limit
        """
        with PerformanceLogger("youtube_download", job_id=job_id, url=url):
            try:
                # Validate URL
                validation = validate_youtube_url(url)
                video_id = validation["video_id"]

                logger.info(
                    "youtube_download_started",
                    job_id=job_id,
                    url=url,
                    video_id=video_id,
                )

                # Get video info first
                video_info = self._get_video_info(url)

                # Validate duration
                duration = video_info.get("duration", 0)
                if duration > self.max_duration:
                    raise VideoTooLongError(
                        url=url,
                        duration=float(duration),
                        max_duration=float(self.max_duration),
                    )

                # Download audio
                output_path = self._download_with_ytdlp(url, video_id, job_id)

                logger.info(
                    "youtube_download_completed",
                    job_id=job_id,
                    url=url,
                    output_path=output_path,
                    duration=duration,
                )

                return output_path

            except (VideoNotFoundError, VideoTooLongError):
                raise
            except Exception as e:
                logger.error(
                    "youtube_download_failed",
                    job_id=job_id,
                    url=url,
                    error=str(e),
                    exc_info=True,
                )
                raise YouTubeDownloadError(
                    message=f"Failed to download audio: {str(e)}",
                    url=url,
                )

    def _get_video_info(self, url: str) -> Dict:
        """
        Get video information without downloading.

        Args:
            url: YouTube URL

        Returns:
            Dictionary with video information

        Raises:
            YouTubeDownloadError: If info retrieval fails
        """
        try:
            cmd = [
                "yt-dlp",
                "--dump-json",
                "--no-playlist",
                url,
            ]

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True,
            )

            import json

            video_info = json.loads(result.stdout)

            logger.debug(
                "video_info_retrieved",
                url=url,
                title=video_info.get("title"),
                duration=video_info.get("duration"),
            )

            return video_info

        except subprocess.CalledProcessError as e:
            if "Video unavailable" in e.stderr or "not available" in e.stderr:
                raise VideoNotFoundError(url=url)

            raise YouTubeDownloadError(
                message=f"Failed to get video info: {e.stderr}",
                url=url,
            )
        except json.JSONDecodeError as e:
            raise YouTubeDownloadError(
                message=f"Failed to parse video info: {str(e)}",
                url=url,
            )

    def _download_with_ytdlp(self, url: str, video_id: str, job_id: str) -> str:
        """
        Download audio using yt-dlp.

        Args:
            url: YouTube URL
            video_id: YouTube video ID
            job_id: Job identifier

        Returns:
            Path to downloaded file

        Raises:
            YouTubeDownloadError: If download fails
        """
        try:
            # Create output path
            output_template = os.path.join(
                self.download_dir,
                f"{job_id}_{video_id}.%(ext)s",
            )

            cmd = [
                "yt-dlp",
                "-f",
                self.format,
                "-o",
                output_template,
                "--no-playlist",
                "--no-continue",  # Don't resume downloads
                "--quiet",
                "--progress",
                url,
            ]

            logger.debug("ytdlp_command", job_id=job_id, command=" ".join(cmd))

            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                check=True,
            )

            # Find downloaded file
            import glob

            pattern = os.path.join(self.download_dir, f"{job_id}_{video_id}.*")
            files = glob.glob(pattern)

            if not files:
                raise YouTubeDownloadError(
                    message="Downloaded file not found",
                    url=url,
                    pattern=pattern,
                )

            output_path = files[0]

            logger.debug(
                "ytdlp_download_completed",
                job_id=job_id,
                output_path=output_path,
            )

            return output_path

        except subprocess.CalledProcessError as e:
            error_msg = e.stderr if e.stderr else str(e)

            if "Video unavailable" in error_msg or "not available" in error_msg:
                raise VideoNotFoundError(url=url)

            raise YouTubeDownloadError(
                message=f"yt-dlp failed: {error_msg}",
                url=url,
            )

    def validate_url(self, url: str) -> Dict:
        """
        Validate YouTube URL and get basic info.

        Args:
            url: YouTube URL to validate

        Returns:
            Dictionary with validation result and video info

        Raises:
            ValidationError: If URL is invalid
        """
        validation = validate_youtube_url(url)

        try:
            info = self._get_video_info(url)
            validation["video_info"] = {
                "title": info.get("title"),
                "duration": info.get("duration"),
                "uploader": info.get("uploader"),
            }
        except Exception as e:
            logger.warning("video_info_retrieval_failed", url=url, error=str(e))

        return validation