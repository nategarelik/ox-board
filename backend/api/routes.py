"""
FastAPI route definitions for Demucs backend.

Implements endpoints for job creation, status checking, and health monitoring.
"""

import os
from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile, status
from fastapi.responses import JSONResponse

from backend.api.dependencies import AudioProcessingServiceDep, QueueServiceDep
from backend.core.config import get_config
from backend.core.exceptions import DemucsException
from backend.core.logging import get_logger
from backend.models.audio import StemSeparationOptions
from backend.models.response import (
    ErrorResponse,
    HealthResponse,
    JobStatusResponse,
    StemifyResponse,
)
from backend.utils.file_utils import create_temp_directory, generate_unique_filename
from backend.utils.validation import validate_model_name, validate_output_format

logger = get_logger(__name__)
config = get_config()

router = APIRouter()


@router.post(
    "/stemify",
    response_model=StemifyResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Create stem separation job",
    description="Upload audio file or provide YouTube URL for stem separation",
)
async def create_stemify_job(
    audio_processing: AudioProcessingServiceDep,
    file: Optional[UploadFile] = File(None, description="Audio file to process"),
    youtube_url: Optional[str] = Form(None, description="YouTube URL to process"),
    model: str = Form(
        default="htdemucs",
        description="Demucs model to use",
    ),
    output_format: str = Form(
        default="wav",
        description="Output audio format",
    ),
    normalize: bool = Form(
        default=True,
        description="Whether to normalize output",
    ),
) -> StemifyResponse:
    """
    Create a new stem separation job.

    Either file or youtube_url must be provided.

    Args:
        audio_processing: Audio processing service
        file: Uploaded audio file
        youtube_url: YouTube URL
        model: Demucs model to use
        output_format: Output format
        normalize: Whether to normalize

    Returns:
        StemifyResponse with job details

    Raises:
        HTTPException: If validation fails or job creation fails
    """
    try:
        # Validate input
        if not file and not youtube_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Either file or youtube_url must be provided",
            )

        if file and youtube_url:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot provide both file and youtube_url",
            )

        # Validate model and format
        validate_model_name(model)
        validate_output_format(output_format)

        # Create options
        options = StemSeparationOptions(
            model=model,
            output_format=output_format,
            normalize=normalize,
        )

        # Create job based on input type
        if file:
            # Save uploaded file
            temp_dir = create_temp_directory(prefix="upload_")
            filename = generate_unique_filename(file.filename or "audio.mp3")
            file_path = os.path.join(temp_dir, filename)

            with open(file_path, "wb") as f:
                content = await file.read()
                f.write(content)

            logger.info(
                "file_uploaded",
                filename=filename,
                size_mb=len(content) / 1024 / 1024,
                path=file_path,
            )

            job = audio_processing.create_job_from_file(
                file_path=file_path,
                model=model,
                options=options,
            )

        else:
            # YouTube URL
            job = audio_processing.create_job_from_youtube(
                url=youtube_url,
                model=model,
                options=options,
            )

        return StemifyResponse(
            job_id=job.id,
            status="pending",
            estimated_duration=job.estimated_duration,
            message="Job created successfully. Processing will begin shortly.",
        )

    except DemucsException as e:
        logger.error("stemify_job_creation_failed", error=e.message, exc_info=True)
        raise HTTPException(
            status_code=e.status_code,
            detail=e.to_dict(),
        )
    except Exception as e:
        logger.error("unexpected_error", error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": str(e)},
        )


@router.get(
    "/jobs/{job_id}",
    response_model=JobStatusResponse,
    summary="Get job status",
    description="Retrieve status and results for a job",
)
async def get_job_status(
    job_id: str,
    queue_service: QueueServiceDep,
) -> JobStatusResponse:
    """
    Get job status and results.

    Args:
        job_id: Job identifier
        queue_service: Queue service

    Returns:
        JobStatusResponse with job details

    Raises:
        HTTPException: If job not found
    """
    try:
        job = queue_service.get_job(job_id)

        return JobStatusResponse(
            job_id=job.id,
            status=job.status,
            progress=job.progress,
            result=job.result,
            error=job.error,
            created_at=job.created_at,
            updated_at=job.updated_at,
        )

    except DemucsException as e:
        logger.error("job_status_retrieval_failed", job_id=job_id, error=e.message)
        raise HTTPException(
            status_code=e.status_code,
            detail=e.to_dict(),
        )
    except Exception as e:
        logger.error("unexpected_error", job_id=job_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": str(e)},
        )


@router.delete(
    "/jobs/{job_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete job",
    description="Delete a job and its results",
)
async def delete_job(
    job_id: str,
    queue_service: QueueServiceDep,
) -> None:
    """
    Delete a job.

    Args:
        job_id: Job identifier
        queue_service: Queue service

    Raises:
        HTTPException: If job not found or deletion fails
    """
    try:
        queue_service.delete_job(job_id)
        logger.info("job_deleted_via_api", job_id=job_id)

    except DemucsException as e:
        logger.error("job_deletion_failed", job_id=job_id, error=e.message)
        raise HTTPException(
            status_code=e.status_code,
            detail=e.to_dict(),
        )
    except Exception as e:
        logger.error("unexpected_error", job_id=job_id, error=str(e), exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": str(e)},
        )


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Check service health and availability",
)
async def health_check(
    queue_service: QueueServiceDep,
    audio_processing: AudioProcessingServiceDep,
) -> HealthResponse:
    """
    Health check endpoint.

    Args:
        queue_service: Queue service
        audio_processing: Audio processing service

    Returns:
        HealthResponse with service status
    """
    try:
        # Check Redis connection
        redis_healthy = queue_service.health_check()

        # Get queue status
        queue_status = queue_service.get_queue_status()

        # Get available models
        models = audio_processing.stem_service.get_available_models()

        status_value = "healthy" if redis_healthy else "degraded"

        return HealthResponse(
            status=status_value,
            version=config.version,
            models_available=models,
            queue_status={
                "active_jobs": queue_status["active_jobs"],
                "queued_jobs": queue_status["queued_jobs"],
                "workers_available": config.demucs.num_workers,
            },
        )

    except Exception as e:
        logger.error("health_check_failed", error=str(e), exc_info=True)
        return HealthResponse(
            status="unhealthy",
            version=config.version,
            models_available=[],
            queue_status={
                "active_jobs": 0,
                "queued_jobs": 0,
                "workers_available": 0,
            },
        )


# Exception handler for DemucsException
@router.exception_handler(DemucsException)
async def demucs_exception_handler(request, exc: DemucsException):
    """
    Handle DemucsException globally.

    Args:
        request: Request object
        exc: DemucsException instance

    Returns:
        JSONResponse with error details
    """
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.to_dict(),
    )