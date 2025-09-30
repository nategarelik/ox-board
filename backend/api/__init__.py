"""
FastAPI application and API routes.
"""

from backend.api.dependencies import get_audio_processing_service, get_queue_service
from backend.api.middleware import setup_middleware
from backend.api.routes import router

__all__ = [
    "router",
    "setup_middleware",
    "get_queue_service",
    "get_audio_processing_service",
]