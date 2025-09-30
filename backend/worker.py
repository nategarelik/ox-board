"""
Background worker for processing stem separation jobs.

Continuously polls queue and processes jobs.
"""

import signal
import sys
import time
from typing import Optional

from backend.core.config import get_config
from backend.core.logging import get_logger, setup_logging
from backend.core.observability import Metrics, setup_prometheus
from backend.services.audio_processing import AudioProcessingService
from backend.services.queue_service import QueueService
from backend.services.stem_separation import StemSeparationService
from backend.services.youtube_service import YouTubeService

logger = get_logger(__name__)
config = get_config()


class Worker:
    """Background worker for processing jobs."""

    def __init__(self):
        """Initialize worker."""
        self.running = False
        self.queue_service = QueueService()
        self.audio_processing_service = AudioProcessingService(
            queue_service=self.queue_service,
            stem_service=StemSeparationService(),
            youtube_service=YouTubeService(),
        )

        logger.info("worker_initialized")

    def start(self):
        """Start worker loop."""
        self.running = True

        logger.info("worker_started", pid=sys.getpid())

        # Register signal handlers
        signal.signal(signal.SIGINT, self._handle_shutdown)
        signal.signal(signal.SIGTERM, self._handle_shutdown)

        while self.running:
            try:
                # Get next job from queue
                job = self.queue_service.get_next_job()

                if job:
                    logger.info("processing_job", job_id=job.id)

                    try:
                        # Process job
                        result = self.audio_processing_service.process_job(job)

                        logger.info(
                            "job_processed_successfully",
                            job_id=job.id,
                            processing_time=result.processing_time,
                        )

                    except Exception as e:
                        logger.error(
                            "job_processing_error",
                            job_id=job.id,
                            error=str(e),
                            exc_info=True,
                        )
                        # Error handling is done in process_job

                else:
                    # No jobs available, sleep briefly
                    time.sleep(1)

            except KeyboardInterrupt:
                logger.info("worker_interrupted")
                break
            except Exception as e:
                logger.error("worker_error", error=str(e), exc_info=True)
                time.sleep(5)  # Back off on error

        logger.info("worker_stopped")

    def stop(self):
        """Stop worker gracefully."""
        logger.info("worker_stopping")
        self.running = False

    def _handle_shutdown(self, signum, frame):
        """
        Handle shutdown signals.

        Args:
            signum: Signal number
            frame: Current stack frame
        """
        logger.info("shutdown_signal_received", signal=signum)
        self.stop()


def main():
    """Main entry point for worker."""
    # Setup logging
    setup_logging(
        log_level=config.log_level,
        json_logs=config.json_logs,
    )

    # Setup metrics
    if config.observability.enable_tracing:
        setup_prometheus(port=config.observability.prometheus_port + 1)  # Different port for worker

    logger.info(
        "worker_starting",
        environment=config.environment,
        version=config.version,
    )

    # Create and start worker
    worker = Worker()

    try:
        worker.start()
    except Exception as e:
        logger.error("worker_fatal_error", error=str(e), exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()