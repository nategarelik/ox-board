"""
API response models.

Pydantic models for API endpoint responses.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field

from backend.models.job import JobResult, JobStatus


class StemifyResponse(BaseModel):
    """Response for stemify endpoint."""

    job_id: str = Field(..., description="Job identifier")
    status: str = Field(default="pending", description="Initial status")
    estimated_duration: int = Field(..., ge=0, description="Estimated processing time")
    message: str = Field(..., description="Success message")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "pending",
                "estimated_duration": 120,
                "message": "Job created successfully. Processing will begin shortly.",
            }
        }


class JobStatusResponse(BaseModel):
    """Response for job status endpoint."""

    job_id: str = Field(..., description="Job identifier")
    status: JobStatus = Field(..., description="Job status")
    progress: int = Field(..., ge=0, le=100, description="Processing progress")
    result: Optional[JobResult] = Field(None, description="Processing results")
    error: Optional[str] = Field(None, description="Error message")
    created_at: datetime = Field(..., description="Job creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")

    class Config:
        json_schema_extra = {
            "example": {
                "job_id": "550e8400-e29b-41d4-a716-446655440000",
                "status": "processing",
                "progress": 45,
                "result": None,
                "error": None,
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-01-15T10:31:30Z",
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response format."""

    error: dict = Field(..., description="Error details")

    class Config:
        json_schema_extra = {
            "example": {
                "error": {
                    "code": "VALIDATION_ERROR",
                    "message": "File size exceeds maximum of 50MB",
                    "status_code": 400,
                    "context": {"filename": "audio.mp3", "size_bytes": 62914560},
                }
            }
        }


class HealthResponse(BaseModel):
    """Health check response."""

    status: str = Field(..., description="Service status")
    version: str = Field(..., description="API version")
    models_available: list[str] = Field(..., description="Available Demucs models")
    queue_status: dict = Field(..., description="Queue status information")

    class Config:
        json_schema_extra = {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "models_available": ["htdemucs", "htdemucs_ft", "mdx_extra"],
                "queue_status": {
                    "active_jobs": 3,
                    "queued_jobs": 12,
                    "workers_available": 4,
                },
            }
        }