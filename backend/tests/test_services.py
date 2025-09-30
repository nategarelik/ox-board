"""
Tests for backend services.
"""

import pytest
from unittest.mock import MagicMock, patch

from backend.models.audio import StemSeparationOptions
from backend.models.job import InputType, JobStatus
from backend.services.queue_service import QueueService
from backend.services.stem_separation import StemSeparationService


class TestQueueService:
    """Tests for QueueService."""

    @pytest.fixture
    def mock_redis(self):
        """Mock Redis client."""
        return MagicMock()

    @pytest.fixture
    def queue_service(self, mock_redis):
        """Create QueueService with mock Redis."""
        return QueueService(redis_client=mock_redis)

    def test_create_job(self, queue_service, mock_redis):
        """Test job creation."""
        job = queue_service.create_job(
            input_type=InputType.FILE_UPLOAD.value,
            input_source="/tmp/audio.mp3",
            model="htdemucs",
            options=StemSeparationOptions().model_dump(),
            estimated_duration=120,
        )

        assert job.status == JobStatus.PENDING
        assert job.model == "htdemucs"
        assert mock_redis.rpush.called

    def test_update_job_progress(self, queue_service, mock_redis):
        """Test job progress update."""
        # Create job first
        job = queue_service.create_job(
            input_type=InputType.FILE_UPLOAD.value,
            input_source="/tmp/audio.mp3",
            model="htdemucs",
            options=StemSeparationOptions().model_dump(),
            estimated_duration=120,
        )

        # Mock get_job to return the job
        mock_redis.get.return_value = job.model_dump_json()

        # Update progress
        queue_service.update_job_progress(job.id, 50)

        # Verify Redis set was called
        assert mock_redis.set.called

    def test_get_queue_status(self, queue_service, mock_redis):
        """Test queue status retrieval."""
        mock_redis.llen.return_value = 5
        mock_redis.scard.return_value = 3

        status = queue_service.get_queue_status()

        assert status["queued_jobs"] == 5
        assert status["active_jobs"] == 3

    def test_health_check_healthy(self, queue_service, mock_redis):
        """Test health check when Redis is healthy."""
        mock_redis.ping.return_value = True

        assert queue_service.health_check() is True

    def test_health_check_unhealthy(self, queue_service, mock_redis):
        """Test health check when Redis is unhealthy."""
        mock_redis.ping.side_effect = Exception("Connection failed")

        assert queue_service.health_check() is False


class TestStemSeparationService:
    """Tests for StemSeparationService."""

    @pytest.fixture
    def stem_service(self):
        """Create StemSeparationService."""
        return StemSeparationService()

    def test_get_available_models(self, stem_service):
        """Test available models retrieval."""
        models = stem_service.get_available_models()

        assert isinstance(models, list)
        assert "htdemucs" in models
        assert "htdemucs_ft" in models
        assert "mdx_extra" in models

    def test_build_demucs_command(self, stem_service):
        """Test Demucs command building."""
        cmd = stem_service._build_demucs_command(
            audio_path="/tmp/audio.mp3",
            output_dir="/tmp/output",
            model="htdemucs",
            output_format="wav",
            normalize=True,
        )

        assert "python" in cmd
        assert "-m" in cmd
        assert "demucs" in cmd
        assert "-n" in cmd
        assert "htdemucs" in cmd
        assert "/tmp/audio.mp3" in cmd