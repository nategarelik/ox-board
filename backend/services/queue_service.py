"""
Redis-based job queue service with Celery integration.

Manages job lifecycle, status tracking, and queue operations.
"""

import json
import uuid
from datetime import datetime, timedelta
from typing import Dict, List, Optional

import redis
from redis import Redis

from backend.core.config import get_config
from backend.core.exceptions import JobNotFoundError, JobQueueError
from backend.core.logging import get_logger
from backend.core.observability import Metrics
from backend.models.job import Job, JobResult, JobStatus

logger = get_logger(__name__)
config = get_config()


class QueueService:
    """Service for managing job queue with Redis."""

    def __init__(self, redis_client: Optional[Redis] = None):
        """
        Initialize queue service.

        Args:
            redis_client: Optional Redis client (creates new if None)
        """
        if redis_client is None:
            self.redis = redis.from_url(
                config.redis.url,
                db=config.redis.db,
                max_connections=config.redis.max_connections,
                decode_responses=True,
            )
        else:
            self.redis = redis_client

        self.job_key_prefix = "job:"
        self.queue_key = "job_queue"
        self.active_jobs_key = "active_jobs"

        logger.info(
            "queue_service_initialized",
            redis_url=config.redis.url,
            db=config.redis.db,
        )

    def create_job(
        self,
        input_type: str,
        input_source: str,
        model: str,
        options: Dict,
        estimated_duration: int,
    ) -> Job:
        """
        Create a new job and add to queue.

        Args:
            input_type: Source type (file_upload, youtube_url)
            input_source: File path or URL
            model: Demucs model to use
            options: Processing options
            estimated_duration: Estimated processing time

        Returns:
            Created Job instance

        Raises:
            JobQueueError: If job creation fails
        """
        try:
            # Create job
            job_id = str(uuid.uuid4())
            job = Job(
                id=job_id,
                status=JobStatus.PENDING,
                input_type=input_type,
                input_source=input_source,
                model=model,
                options=options,
                estimated_duration=estimated_duration,
            )

            # Save to Redis
            self._save_job(job)

            # Add to queue
            self.redis.rpush(self.queue_key, job_id)

            # Update metrics
            Metrics.jobs_queued.inc()
            Metrics.jobs_total.labels(status="pending", model=model).inc()

            logger.info(
                "job_created",
                job_id=job_id,
                input_type=input_type,
                model=model,
                estimated_duration=estimated_duration,
            )

            return job

        except Exception as e:
            logger.error("job_creation_failed", error=str(e), exc_info=True)
            raise JobQueueError(
                message=f"Failed to create job: {str(e)}",
            )

    def get_job(self, job_id: str) -> Job:
        """
        Get job by ID.

        Args:
            job_id: Job identifier

        Returns:
            Job instance

        Raises:
            JobNotFoundError: If job not found
        """
        job_data = self.redis.get(self._job_key(job_id))

        if not job_data:
            raise JobNotFoundError(job_id=job_id)

        try:
            job_dict = json.loads(job_data)
            return Job(**job_dict)
        except (json.JSONDecodeError, ValueError) as e:
            logger.error("job_deserialization_failed", job_id=job_id, error=str(e))
            raise JobQueueError(
                message=f"Failed to deserialize job: {str(e)}",
                job_id=job_id,
            )

    def update_job(self, job: Job) -> None:
        """
        Update job in Redis.

        Args:
            job: Job instance to update

        Raises:
            JobQueueError: If update fails
        """
        try:
            self._save_job(job)
            logger.debug("job_updated", job_id=job.id, status=job.status.value)
        except Exception as e:
            logger.error("job_update_failed", job_id=job.id, error=str(e))
            raise JobQueueError(
                message=f"Failed to update job: {str(e)}",
                job_id=job.id,
            )

    def update_job_progress(self, job_id: str, progress: int) -> None:
        """
        Update job progress.

        Args:
            job_id: Job identifier
            progress: Progress percentage (0-100)

        Raises:
            JobNotFoundError: If job not found
        """
        job = self.get_job(job_id)
        job.update_progress(progress)
        self.update_job(job)

        logger.debug("job_progress_updated", job_id=job_id, progress=progress)

    def mark_job_processing(self, job_id: str) -> Job:
        """
        Mark job as processing and move to active list.

        Args:
            job_id: Job identifier

        Returns:
            Updated Job instance

        Raises:
            JobNotFoundError: If job not found
        """
        job = self.get_job(job_id)
        job.update_status(JobStatus.PROCESSING)
        self.update_job(job)

        # Add to active jobs set
        self.redis.sadd(self.active_jobs_key, job_id)

        # Update metrics
        Metrics.jobs_active.inc()
        Metrics.jobs_queued.dec()
        Metrics.jobs_total.labels(status="processing", model=job.model).inc()

        logger.info("job_marked_processing", job_id=job_id)
        return job

    def mark_job_completed(
        self,
        job_id: str,
        result: JobResult,
        actual_duration: int,
    ) -> Job:
        """
        Mark job as completed with results.

        Args:
            job_id: Job identifier
            result: Processing results
            actual_duration: Actual processing time

        Returns:
            Updated Job instance

        Raises:
            JobNotFoundError: If job not found
        """
        job = self.get_job(job_id)
        job.mark_completed(result, actual_duration)
        self.update_job(job)

        # Remove from active jobs
        self.redis.srem(self.active_jobs_key, job_id)

        # Update metrics
        Metrics.jobs_active.dec()
        Metrics.jobs_total.labels(status="completed", model=job.model).inc()

        logger.info(
            "job_marked_completed",
            job_id=job_id,
            duration=actual_duration,
        )
        return job

    def mark_job_failed(self, job_id: str, error: str) -> Job:
        """
        Mark job as failed with error message.

        Args:
            job_id: Job identifier
            error: Error message

        Returns:
            Updated Job instance

        Raises:
            JobNotFoundError: If job not found
        """
        job = self.get_job(job_id)
        job.mark_failed(error)
        self.update_job(job)

        # Remove from active jobs
        self.redis.srem(self.active_jobs_key, job_id)

        # Update metrics
        Metrics.jobs_active.dec()
        Metrics.jobs_total.labels(status="failed", model=job.model).inc()

        logger.error("job_marked_failed", job_id=job_id, error=error)
        return job

    def get_next_job(self) -> Optional[Job]:
        """
        Get next job from queue.

        Returns:
            Next Job instance or None if queue is empty
        """
        job_id = self.redis.lpop(self.queue_key)

        if not job_id:
            return None

        try:
            return self.get_job(job_id)
        except JobNotFoundError:
            logger.warning("job_not_found_in_queue", job_id=job_id)
            return self.get_next_job()  # Try next job

    def get_queue_status(self) -> Dict:
        """
        Get queue status information.

        Returns:
            Dictionary with queue metrics
        """
        queued_count = self.redis.llen(self.queue_key)
        active_count = self.redis.scard(self.active_jobs_key)

        return {
            "queued_jobs": queued_count,
            "active_jobs": active_count,
            "total_jobs": self._get_total_jobs_count(),
        }

    def delete_job(self, job_id: str) -> None:
        """
        Delete job from Redis.

        Args:
            job_id: Job identifier

        Raises:
            JobNotFoundError: If job not found
        """
        if not self.redis.exists(self._job_key(job_id)):
            raise JobNotFoundError(job_id=job_id)

        # Remove from all structures
        self.redis.delete(self._job_key(job_id))
        self.redis.lrem(self.queue_key, 0, job_id)
        self.redis.srem(self.active_jobs_key, job_id)

        logger.info("job_deleted", job_id=job_id)

    def cleanup_old_jobs(self, days: int = 30) -> int:
        """
        Clean up jobs older than specified days.

        Args:
            days: Number of days to keep jobs

        Returns:
            Number of jobs cleaned up
        """
        cutoff_time = datetime.utcnow() - timedelta(days=days)
        cleaned_count = 0

        # Scan for all job keys
        for key in self.redis.scan_iter(match=f"{self.job_key_prefix}*"):
            try:
                job_data = self.redis.get(key)
                if not job_data:
                    continue

                job_dict = json.loads(job_data)
                created_at = datetime.fromisoformat(
                    job_dict.get("created_at", "").replace("Z", "+00:00")
                )

                if created_at < cutoff_time:
                    job_id = job_dict.get("id")
                    if job_id:
                        self.delete_job(job_id)
                        cleaned_count += 1

            except Exception as e:
                logger.warning("job_cleanup_error", key=key, error=str(e))
                continue

        logger.info("jobs_cleaned_up", count=cleaned_count, days=days)
        return cleaned_count

    def _save_job(self, job: Job) -> None:
        """
        Save job to Redis.

        Args:
            job: Job instance to save
        """
        job_data = job.model_dump_json()
        self.redis.set(self._job_key(job.id), job_data)

    def _job_key(self, job_id: str) -> str:
        """
        Get Redis key for job.

        Args:
            job_id: Job identifier

        Returns:
            Redis key
        """
        return f"{self.job_key_prefix}{job_id}"

    def _get_total_jobs_count(self) -> int:
        """
        Get total count of jobs in Redis.

        Returns:
            Total job count
        """
        count = 0
        for _ in self.redis.scan_iter(match=f"{self.job_key_prefix}*"):
            count += 1
        return count

    def health_check(self) -> bool:
        """
        Check Redis connection health.

        Returns:
            True if healthy, False otherwise
        """
        try:
            self.redis.ping()
            return True
        except Exception as e:
            logger.error("redis_health_check_failed", error=str(e))
            return False