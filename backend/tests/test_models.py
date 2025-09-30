"""
Tests for Pydantic models.
"""

import pytest
from datetime import datetime

from backend.models.audio import (
    AudioFormat,
    QualityMetrics,
    QualityPreset,
    StemFiles,
    StemInfo,
    StemSeparationOptions,
)
from backend.models.job import Job, JobResult, JobStatus, InputType
from backend.models.response import ErrorResponse, JobStatusResponse, StemifyResponse


class TestAudioModels:
    """Tests for audio-related models."""

    def test_stem_info_creation(self):
        """Test StemInfo model creation."""
        stem = StemInfo(
            filename="vocals.wav",
            path="/tmp/vocals.wav",
            size=1024000,
            duration=180.5,
            format=AudioFormat.WAV,
            sample_rate=44100,
            bitrate=None,
            cdn_url=None,
        )

        assert stem.filename == "vocals.wav"
        assert stem.size == 1024000
        assert stem.duration == 180.5
        assert stem.format == AudioFormat.WAV

    def test_stem_separation_options_defaults(self):
        """Test StemSeparationOptions default values."""
        options = StemSeparationOptions()

        assert options.model == "htdemucs"
        assert options.quality == QualityPreset.BALANCED
        assert options.output_format == AudioFormat.WAV
        assert options.normalize is True

    def test_stem_separation_options_validation(self):
        """Test model validation."""
        with pytest.raises(ValueError):
            StemSeparationOptions(model="invalid_model")


class TestJobModels:
    """Tests for job-related models."""

    def test_job_creation(self):
        """Test Job model creation."""
        job = Job(
            id="test-job-id",
            input_type=InputType.FILE_UPLOAD,
            input_source="/tmp/audio.mp3",
            model="htdemucs",
        )

        assert job.id == "test-job-id"
        assert job.status == JobStatus.PENDING
        assert job.progress == 0
        assert job.result is None

    def test_job_update_status(self):
        """Test job status update."""
        job = Job(
            id="test-job-id",
            input_type=InputType.FILE_UPLOAD,
            input_source="/tmp/audio.mp3",
            model="htdemucs",
        )

        job.update_status(JobStatus.PROCESSING)
        assert job.status == JobStatus.PROCESSING

    def test_job_update_progress(self):
        """Test job progress update."""
        job = Job(
            id="test-job-id",
            input_type=InputType.FILE_UPLOAD,
            input_source="/tmp/audio.mp3",
            model="htdemucs",
        )

        job.update_progress(50)
        assert job.progress == 50

        # Test bounds
        job.update_progress(150)
        assert job.progress == 100

        job.update_progress(-10)
        assert job.progress == 0

    def test_job_mark_failed(self):
        """Test marking job as failed."""
        job = Job(
            id="test-job-id",
            input_type=InputType.FILE_UPLOAD,
            input_source="/tmp/audio.mp3",
            model="htdemucs",
        )

        job.mark_failed("Test error")
        assert job.status == JobStatus.FAILED
        assert job.error == "Test error"


class TestResponseModels:
    """Tests for response models."""

    def test_stemify_response(self):
        """Test StemifyResponse model."""
        response = StemifyResponse(
            job_id="test-id",
            status="pending",
            estimated_duration=120,
            message="Job created",
        )

        assert response.job_id == "test-id"
        assert response.estimated_duration == 120

    def test_job_status_response(self):
        """Test JobStatusResponse model."""
        response = JobStatusResponse(
            job_id="test-id",
            status=JobStatus.PROCESSING,
            progress=50,
            result=None,
            error=None,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
        )

        assert response.job_id == "test-id"
        assert response.status == JobStatus.PROCESSING
        assert response.progress == 50