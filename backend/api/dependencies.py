"""
Dependency injection for FastAPI routes.

Provides singleton services to route handlers.
"""

from functools import lru_cache
from typing import Annotated

from fastapi import Depends
from redis import Redis

from backend.core.config import get_config
from backend.services.audio_processing import AudioProcessingService
from backend.services.queue_service import QueueService
from backend.services.stem_separation import StemSeparationService
from backend.services.youtube_service import YouTubeService

config = get_config()


@lru_cache()
def get_redis_client() -> Redis:
    """
    Get Redis client singleton.

    Returns:
        Redis client instance
    """
    return Redis.from_url(
        config.redis.url,
        db=config.redis.db,
        max_connections=config.redis.max_connections,
        decode_responses=True,
    )


@lru_cache()
def get_queue_service() -> QueueService:
    """
    Get QueueService singleton.

    Returns:
        QueueService instance
    """
    redis_client = get_redis_client()
    return QueueService(redis_client=redis_client)


@lru_cache()
def get_stem_service() -> StemSeparationService:
    """
    Get StemSeparationService singleton.

    Returns:
        StemSeparationService instance
    """
    return StemSeparationService()


@lru_cache()
def get_youtube_service() -> YouTubeService:
    """
    Get YouTubeService singleton.

    Returns:
        YouTubeService instance
    """
    return YouTubeService()


@lru_cache()
def get_audio_processing_service() -> AudioProcessingService:
    """
    Get AudioProcessingService singleton.

    Returns:
        AudioProcessingService instance
    """
    return AudioProcessingService(
        queue_service=get_queue_service(),
        stem_service=get_stem_service(),
        youtube_service=get_youtube_service(),
    )


# Type annotations for dependency injection
QueueServiceDep = Annotated[QueueService, Depends(get_queue_service)]
AudioProcessingServiceDep = Annotated[
    AudioProcessingService, Depends(get_audio_processing_service)
]