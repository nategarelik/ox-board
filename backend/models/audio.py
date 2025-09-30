"""
Audio-related Pydantic models.

Models for stem information, separation options, and quality metrics.
"""

from enum import Enum
from typing import Optional

from pydantic import BaseModel, Field, field_validator


class AudioFormat(str, Enum):
    """Supported audio formats."""

    WAV = "wav"
    MP3 = "mp3"
    FLAC = "flac"


class QualityPreset(str, Enum):
    """Quality presets for processing."""

    FAST = "fast"
    BALANCED = "balanced"
    BEST = "best"


class StemInfo(BaseModel):
    """Metadata for an individual audio stem."""

    filename: str = Field(..., description="Output filename")
    path: str = Field(..., description="Local file path")
    size: int = Field(..., ge=0, description="File size in bytes")
    duration: float = Field(..., ge=0, description="Audio duration in seconds")
    format: AudioFormat = Field(..., description="Audio format")
    sample_rate: int = Field(..., ge=0, description="Audio sample rate")
    bitrate: Optional[int] = Field(None, ge=0, description="Audio bitrate")
    cdn_url: Optional[str] = Field(None, description="CDN URL for streaming")

    class Config:
        json_schema_extra = {
            "example": {
                "filename": "vocals.wav",
                "path": "/tmp/job-123/vocals.wav",
                "size": 15728640,
                "duration": 180.5,
                "format": "wav",
                "sample_rate": 44100,
                "bitrate": None,
                "cdn_url": "https://cdn.oxboard.com/stems/job-123/vocals.wav",
            }
        }


class StemFiles(BaseModel):
    """Information about individual separated audio stems."""

    vocals: StemInfo = Field(..., description="Vocal stem information")
    drums: StemInfo = Field(..., description="Drums stem information")
    bass: StemInfo = Field(..., description="Bass stem information")
    other: StemInfo = Field(..., description="Other instruments stem information")


class StemSeparationOptions(BaseModel):
    """Configuration options for stem separation processing."""

    model: str = Field(
        default="htdemucs",
        description="Demucs model selection",
    )
    quality: QualityPreset = Field(
        default=QualityPreset.BALANCED,
        description="Quality preset",
    )
    output_format: AudioFormat = Field(
        default=AudioFormat.WAV,
        description="Output audio format",
    )
    normalize: bool = Field(
        default=True,
        description="Whether to normalize output",
    )
    remove_vocals: bool = Field(
        default=False,
        description="Whether to remove vocals (karaoke mode)",
    )
    segment_duration: Optional[float] = Field(
        None,
        gt=0,
        description="Segment duration for processing",
    )
    overlap_duration: Optional[float] = Field(
        None,
        gt=0,
        description="Overlap between segments",
    )

    @field_validator("model")
    @classmethod
    def validate_model(cls, v: str) -> str:
        """Validate Demucs model name."""
        valid_models = ["htdemucs", "htdemucs_ft", "mdx_extra", "mdx_extra_q"]
        if v not in valid_models:
            raise ValueError(
                f"Model '{v}' not supported. Valid models: {', '.join(valid_models)}"
            )
        return v

    class Config:
        json_schema_extra = {
            "example": {
                "model": "htdemucs",
                "quality": "balanced",
                "output_format": "wav",
                "normalize": True,
                "remove_vocals": False,
                "segment_duration": None,
                "overlap_duration": None,
            }
        }


class QualityMetrics(BaseModel):
    """Assessment of stem separation quality."""

    overall_score: float = Field(..., ge=0, le=1, description="Overall quality score")
    vocal_isolation: float = Field(..., ge=0, le=1, description="Vocal isolation accuracy")
    drum_separation: float = Field(..., ge=0, le=1, description="Drum separation accuracy")
    bass_isolation: float = Field(..., ge=0, le=1, description="Bass isolation accuracy")
    artifact_reduction: float = Field(..., ge=0, le=1, description="Artifact reduction score")
    method: str = Field(..., description="Quality assessment method used")

    class Config:
        json_schema_extra = {
            "example": {
                "overall_score": 0.87,
                "vocal_isolation": 0.92,
                "drum_separation": 0.85,
                "bass_isolation": 0.83,
                "artifact_reduction": 0.88,
                "method": "spectral_analysis",
            }
        }