"""
Configuration management using Pydantic Settings.

Supports environment variables and .env files.
"""

import os
from functools import lru_cache
from typing import Optional

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class DemucsConfig(BaseSettings):
    """Demucs-specific configuration."""

    model_config = SettingsConfigDict(env_prefix="DEMUCS_")

    models_path: str = Field(default="/models/demucs", description="Path to Demucs models")
    default_model: str = Field(default="htdemucs", description="Default model to use")
    max_file_size: int = Field(default=52428800, description="Max file size in bytes (50MB)")
    max_duration: int = Field(default=600, description="Max audio duration in seconds")
    gpu_enabled: bool = Field(default=True, description="Enable GPU acceleration")
    num_workers: int = Field(default=1, description="Number of parallel workers")


class RedisConfig(BaseSettings):
    """Redis configuration."""

    model_config = SettingsConfigDict(env_prefix="REDIS_")

    url: str = Field(default="redis://localhost:6379", description="Redis connection URL")
    db: int = Field(default=0, description="Redis database number")
    max_connections: int = Field(default=50, description="Max connection pool size")


class YouTubeConfig(BaseSettings):
    """YouTube download configuration."""

    model_config = SettingsConfigDict(env_prefix="YOUTUBE_")

    download_dir: str = Field(default="/tmp/downloads", description="Temporary download directory")
    max_duration: int = Field(default=600, description="Max video duration in seconds")
    format: str = Field(default="bestaudio[ext=m4a]", description="yt-dlp format string")


class APIConfig(BaseSettings):
    """API configuration."""

    model_config = SettingsConfigDict(env_prefix="API_")

    rate_limit: int = Field(default=5, description="Max jobs per time period")
    rate_limit_period: int = Field(default=3600, description="Rate limit period in seconds")
    cors_origins: list[str] = Field(default=["*"], description="Allowed CORS origins")
    request_timeout: int = Field(default=300, description="Request timeout in seconds")


class ObservabilityConfig(BaseSettings):
    """Observability configuration."""

    model_config = SettingsConfigDict(env_prefix="OBSERVABILITY_")

    prometheus_port: int = Field(default=9090, description="Prometheus metrics port")
    otlp_endpoint: Optional[str] = Field(default=None, description="OTLP collector endpoint")
    enable_tracing: bool = Field(default=True, description="Enable distributed tracing")


class Config(BaseSettings):
    """Main application configuration."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Application
    app_name: str = Field(default="OX Board Demucs Backend", description="Application name")
    version: str = Field(default="1.0.0", description="Application version")
    environment: str = Field(default="development", description="Environment (development/production)")
    log_level: str = Field(default="INFO", description="Logging level")
    debug: bool = Field(default=False, description="Debug mode")

    # Host/Port
    host: str = Field(default="0.0.0.0", description="Server host")
    port: int = Field(default=8000, description="Server port")

    # Sub-configurations
    demucs: DemucsConfig = Field(default_factory=DemucsConfig)
    redis: RedisConfig = Field(default_factory=RedisConfig)
    youtube: YouTubeConfig = Field(default_factory=YouTubeConfig)
    api: APIConfig = Field(default_factory=APIConfig)
    observability: ObservabilityConfig = Field(default_factory=ObservabilityConfig)

    @property
    def is_production(self) -> bool:
        """Check if running in production."""
        return self.environment.lower() == "production"

    @property
    def json_logs(self) -> bool:
        """Use JSON logs in production."""
        return self.is_production


@lru_cache()
def get_config() -> Config:
    """
    Get cached configuration instance.

    Returns:
        Config: Application configuration
    """
    return Config()


# Example .env file
ENV_EXAMPLE = """
# Application
APP_NAME=OX Board Demucs Backend
VERSION=1.0.0
ENVIRONMENT=production
LOG_LEVEL=INFO
DEBUG=false

# Server
HOST=0.0.0.0
PORT=8000

# Demucs
DEMUCS_MODELS_PATH=/models/demucs
DEMUCS_DEFAULT_MODEL=htdemucs
DEMUCS_MAX_FILE_SIZE=52428800
DEMUCS_MAX_DURATION=600
DEMUCS_GPU_ENABLED=true

# Redis
REDIS_URL=redis://localhost:6379
REDIS_DB=0

# YouTube
YOUTUBE_DOWNLOAD_DIR=/tmp/downloads
YOUTUBE_MAX_DURATION=600

# API
API_RATE_LIMIT=5
API_RATE_LIMIT_PERIOD=3600
API_CORS_ORIGINS=["http://localhost:3000","https://oxboard.vercel.app"]

# Observability
OBSERVABILITY_PROMETHEUS_PORT=9090
OBSERVABILITY_ENABLE_TRACING=true
"""


if __name__ == "__main__":
    # Print example configuration
    config = get_config()
    print("Configuration loaded successfully:")
    print(f"  App: {config.app_name} v{config.version}")
    print(f"  Environment: {config.environment}")
    print(f"  Debug: {config.debug}")
    print(f"  Demucs Model: {config.demucs.default_model}")
    print(f"  Redis: {config.redis.url}")
    print(f"  GPU Enabled: {config.demucs.gpu_enabled}")