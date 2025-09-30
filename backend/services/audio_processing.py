"""
Audio processing orchestration service.

Coordinates the full pipeline: upload → validation → Demucs → output.
"""

import os
import time
from typing import Optional

from backend.core.logging import PerformanceLogger, get_logger
from backend.core.observability import Metrics, traced
from backend.models.audio import StemSeparationOptions
from backend.models.job import InputType, Job, JobResult
from backend.services.queue_service import QueueService
from backend.services.stem_separation import StemSeparationService
from backend.services.youtube_service import YouTubeService
from backend.utils.file_utils import cleanup_directory, create_temp_directory
from backend.utils.validation import validate_audio_file

logger = get_logger(__name__)


class AudioProcessingService:
    """Service for orchestrating audio processing pipeline."""

    def __init__(
        self,
        queue_service: QueueService,
        stem_service: StemSeparationService,
        youtube_service: YouTubeService,
    ):
        """
        Initialize audio processing service.

        Args:
            queue_service: Job queue service
            stem_service: Stem separation service
            youtube_service: YouTube download service
        """
        self.queue_service = queue_service
        self.stem_service = stem_service
        self.youtube_service = youtube_service

        logger.info("audio_processing_service_initialized")

    @traced("process_job")
    def process_job(self, job: Job) -> JobResult:
        """
        Process a job through the complete pipeline.

        Args:
            job: Job to process

        Returns:
            JobResult with processing results

        Raises:
            DemucsException: If processing fails
        """
        with PerformanceLogger("job_processing", job_id=job.id):
            start_time = time.time()
            temp_dir = None
            audio_path = None

            try:
                # Mark as processing
                self.queue_service.mark_job_processing(job.id)

                # Create temp directory for processing
                temp_dir = create_temp_directory(prefix=f"job_{job.id}_")

                # Stage 1: Get audio file
                if job.input_type == InputType.FILE_UPLOAD:
                    audio_path = job.input_source
                    self.queue_service.update_job_progress(job.id, 10)
                elif job.input_type == InputType.YOUTUBE_URL:
                    logger.info("downloading_youtube_audio", job_id=job.id)
                    audio_path = self.youtube_service.download_audio(
                        url=job.input_source,
                        job_id=job.id,
                    )
                    self.queue_service.update_job_progress(job.id, 30)

                # Stage 2: Validate audio
                logger.info("validating_audio", job_id=job.id, path=audio_path)
                validation_result = validate_audio_file(audio_path)
                self.queue_service.update_job_progress(job.id, 40)

                # Stage 3: Separate stems
                logger.info("separating_stems", job_id=job.id)
                output_dir = os.path.join(temp_dir, "output")

                def progress_callback(progress: int):
                    """Update job progress during separation."""
                    # Map 0-100 demucs progress to 40-90 job progress
                    job_progress = 40 + int(progress * 0.5)
                    self.queue_service.update_job_progress(job.id, job_progress)

                stem_files = self.stem_service.separate_stems(
                    audio_path=audio_path,
                    output_dir=output_dir,
                    model=job.model,
                    job_id=job.id,
                    output_format=job.options.output_format,
                    normalize=job.options.normalize,
                    progress_callback=progress_callback,
                )

                self.queue_service.update_job_progress(job.id, 95)

                # Stage 4: Create result
                actual_duration = int(time.time() - start_time)

                # Calculate total output size
                total_size = sum(
                    [
                        stem_files.vocals.size,
                        stem_files.drums.size,
                        stem_files.bass.size,
                        stem_files.other.size,
                    ]
                )

                result = JobResult(
                    job_id=job.id,
                    output_dir=output_dir,
                    stems=stem_files,
                    processing_time=actual_duration,
                    model_used=job.model,
                    quality_metrics=None,  # TODO: Implement quality assessment
                    file_size=total_size,
                    cdn_urls=[],  # TODO: Upload to CDN
                )

                # Mark job completed
                self.queue_service.mark_job_completed(
                    job_id=job.id,
                    result=result,
                    actual_duration=actual_duration,
                )

                # Record metrics
                Metrics.processing_duration.labels(
                    model=job.model,
                    status="success",
                ).observe(actual_duration)

                logger.info(
                    "job_processing_completed",
                    job_id=job.id,
                    duration=actual_duration,
                    output_dir=output_dir,
                )

                return result

            except Exception as e:
                # Mark job failed
                error_message = str(e)
                self.queue_service.mark_job_failed(job.id, error_message)

                logger.error(
                    "job_processing_failed",
                    job_id=job.id,
                    error=error_message,
                    exc_info=True,
                )

                raise

            finally:
                # Cleanup temporary files (but keep output directory)
                if temp_dir and job.input_type == InputType.YOUTUBE_URL:
                    # Clean up downloaded YouTube file
                    if audio_path and os.path.exists(audio_path):
                        try:
                            os.remove(audio_path)
                            logger.debug("temp_file_removed", path=audio_path)
                        except OSError as e:
                            logger.warning(
                                "temp_file_removal_failed",
                                path=audio_path,
                                error=str(e),
                            )

    def create_job_from_file(
        self,
        file_path: str,
        model: str,
        options: Optional[StemSeparationOptions] = None,
    ) -> Job:
        """
        Create job from uploaded file.

        Args:
            file_path: Path to uploaded audio file
            model: Demucs model to use
            options: Processing options

        Returns:
            Created Job instance
        """
        # Validate file
        validation = validate_audio_file(file_path)

        # Estimate duration (roughly 1:1 for CPU, faster for GPU)
        estimated_duration = int(validation["duration"] * 1.5)

        # Create job
        job = self.queue_service.create_job(
            input_type=InputType.FILE_UPLOAD.value,
            input_source=file_path,
            model=model,
            options=(options or StemSeparationOptions()).model_dump(),
            estimated_duration=estimated_duration,
        )

        logger.info(
            "job_created_from_file",
            job_id=job.id,
            file_path=file_path,
            model=model,
            estimated_duration=estimated_duration,
        )

        return job

    def create_job_from_youtube(
        self,
        url: str,
        model: str,
        options: Optional[StemSeparationOptions] = None,
    ) -> Job:
        """
        Create job from YouTube URL.

        Args:
            url: YouTube URL
            model: Demucs model to use
            options: Processing options

        Returns:
            Created Job instance
        """
        # Validate URL and get info
        validation = self.youtube_service.validate_url(url)

        # Estimate duration
        video_info = validation.get("video_info", {})
        duration = video_info.get("duration", 180)  # Default 3 minutes
        estimated_duration = int(duration * 1.5) + 30  # Add download time

        # Create job
        job = self.queue_service.create_job(
            input_type=InputType.YOUTUBE_URL.value,
            input_source=url,
            model=model,
            options=(options or StemSeparationOptions()).model_dump(),
            estimated_duration=estimated_duration,
        )

        logger.info(
            "job_created_from_youtube",
            job_id=job.id,
            url=url,
            model=model,
            estimated_duration=estimated_duration,
        )

        return job