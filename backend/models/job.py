"""
Job processing models.

Models for job lifecycle management, status tracking, and results.
"""

from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field

from backend.models.audio import QualityMetrics, StemFiles, StemSeparationOptions


class JobStatus(str, Enum):
    """Job processing status."""

    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class InputType(str, Enum):
    """Source type for input audio."""

    FILE_UPLOAD = "file_upload"
    YOUTUBE_URL = "youtube_url"


class JobResult(BaseModel):
    """Results of a completed stem separation job."""

    job_id: str = Field(..., description="Reference to parent Job")
    output_dir: str = Field(..., description="Directory containing separated stems")
    stems: StemFiles = Field(..., description="Individual stem file information")
    processing_time: int = Field(..., ge=0, description="Actual processing duration")
    model_used: str = Field(..., description="Model that was actually used")
    quality_metrics: Optional[QualityMetrics] = Field(
        None,
        description="Separation quality assessment",
    )
    file_size: int = Field(..., ge=0, description="Total size of all output files")
    cdn_urls: list[str] = Field(
        default_factory=list,
        description="CDN URLs for stem access",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "550e8400-e29b-41d4-a716-446655440000",
                "output_dir": "/tmp/jobs/550e8400-e29b-41d4-a716-446655440000",
                "stems": {},
                "processing_time": 95,
                "model_used": "htdemucs",
                "quality_metrics": None,
                "file_size": 62914560,
                "cdn_urls": [],
            }
        }


class Job(BaseModel):
    """Represents a stem separation task with tracking and status management."""

    id: str = Field(..., description="Unique job identifier (UUID)")
    status: JobStatus = Field(
        default=JobStatus.PENDING,
        description="Job status",
    )
    created_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Job creation timestamp",
    )
    updated_at: datetime = Field(
        default_factory=datetime.utcnow,
        description="Last update timestamp",
    )
    input_type: InputType = Field(..., description="Source type")
    input_source: str = Field(..., description="File path or YouTube URL")
    model: str = Field(..., description="Demucs model used")
    options: StemSeparationOptions = Field(
        default_factory=StemSeparationOptions,
        description="Processing configuration",
    )
    progress: int = Field(
        default=0,
        ge=0,
        le=100,
        description="Processing progress (0-100)",
    )
    result: Optional[JobResult] = Field(
        None,
        description="Processing results when complete",
    )
    error: Optional[str] = Field(
        None,
        description="Error message if failed",
    )
    estimated_duration: int = Field(
        default=0,
        ge=0,
        description="Estimated processing time in seconds",
    )
    actual_duration: Optional[int] = Field(
        None,
        ge=0,
        description="Actual processing time when complete",
    )

    def update_status(self, status: JobStatus, error: Optional[str] = None) -> None:
        """
        Update job status and timestamp.

        Args:
            status: New job status
            error: Optional error message if failed
        """
        self.status = status
        self.updated_at = datetime.utcnow()
        if error:
            self.error = error

    def update_progress(self, progress: int) -> None:
        """
        Update job progress.

        Args:
            progress: Progress percentage (0-100)
        """
        self.progress = max(0, min(100, progress))
        self.updated_at = datetime.utcnow()

    def mark_completed(self, result: JobResult, actual_duration: int) -> None:
        """
        Mark job as completed with results.

        Args:
            result: Processing results
            actual_duration: Actual processing time in seconds
        """
        self.status = JobStatus.COMPLETED
        self.result = result
        self.actual_duration = actual_duration
        self.progress = 100
        self.updated_at = datetime.utcnow()

    def mark_failed(self, error: str) -> None:
        """
        Mark job as failed with error message.

        Args:
            error: Error message
        """
        self.status = JobStatus.FAILED
        self.error = error
        self.updated_at = datetime.utcnow()

    class Config:
        json_schema_extra = {
            "example": {
                "id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "pending",
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:30:00Z",
                "input_type": "file_upload",
                "input_source": "/tmp/uploads/audio.mp3",
                "model": "htdemucs",
                "options": {},
                "progress": 0,
                "result": None,
                "error": None,
                "estimated_duration": 120,
                "actual_duration": None,
            }
        }