"""
Demucs stem separation service.

Handles model loading, stem separation processing, and output management.
"""

import os
import subprocess
import time
from pathlib import Path
from typing import Dict, List, Optional

from backend.core.config import get_config
from backend.core.exceptions import (
    DemucsProcessingError,
    ModelLoadError,
    StemSeparationError,
)
from backend.core.logging import PerformanceLogger, get_logger
from backend.core.observability import Metrics, traced
from backend.models.audio import AudioFormat, StemFiles, StemInfo
from backend.utils.audio_utils import get_audio_metadata
from backend.utils.file_utils import (
    ensure_directory_exists,
    get_directory_size,
    get_file_size,
    list_files_in_directory,
)

logger = get_logger(__name__)
config = get_config()


class StemSeparationService:
    """Service for Demucs-based stem separation."""

    def __init__(self):
        """Initialize stem separation service."""
        self.models_path = config.demucs.models_path
        self.default_model = config.demucs.default_model
        self.gpu_enabled = config.demucs.gpu_enabled
        self._loaded_models: Dict[str, bool] = {}

        # Ensure models directory exists
        ensure_directory_exists(self.models_path)

        logger.info(
            "stem_separation_service_initialized",
            models_path=self.models_path,
            default_model=self.default_model,
            gpu_enabled=self.gpu_enabled,
        )

    def _get_available_models(self) -> List[str]:
        """
        Get list of available Demucs models.

        Returns:
            List of available model names
        """
        # Standard Demucs models
        available_models = ["htdemucs", "htdemucs_ft", "mdx_extra", "mdx_extra_q"]

        logger.debug("available_models_retrieved", models=available_models)
        return available_models

    @traced("load_model")
    def _load_model(self, model_name: str) -> None:
        """
        Ensure Demucs model is available.

        Args:
            model_name: Name of the model to load

        Raises:
            ModelLoadError: If model cannot be loaded
        """
        if model_name in self._loaded_models:
            logger.debug("model_already_loaded", model=model_name)
            return

        with PerformanceLogger("model_load", model=model_name):
            try:
                available_models = self._get_available_models()
                if model_name not in available_models:
                    raise ModelLoadError(
                        model_name=model_name,
                        reason=f"Model not in available list: {available_models}",
                    )

                self._loaded_models[model_name] = True

                logger.info("model_loaded_successfully", model=model_name)

            except Exception as e:
                raise ModelLoadError(
                    model_name=model_name,
                    reason=str(e),
                )

    @traced("separate_stems")
    def separate_stems(
        self,
        audio_path: str,
        output_dir: str,
        model: str,
        job_id: str,
        output_format: AudioFormat = AudioFormat.WAV,
        normalize: bool = True,
        progress_callback: Optional[callable] = None,
    ) -> StemFiles:
        """
        Separate audio into stems using Demucs.

        Args:
            audio_path: Path to input audio file
            output_dir: Directory for output stems
            model: Demucs model to use
            job_id: Job identifier for logging
            output_format: Output audio format
            normalize: Whether to normalize output
            progress_callback: Optional callback for progress updates

        Returns:
            StemFiles with information about separated stems

        Raises:
            StemSeparationError: If separation fails
        """
        with PerformanceLogger("stem_separation", job_id=job_id, model=model):
            try:
                # Load model
                self._load_model(model)

                # Ensure output directory exists
                ensure_directory_exists(output_dir)

                # Build demucs command
                cmd = self._build_demucs_command(
                    audio_path=audio_path,
                    output_dir=output_dir,
                    model=model,
                    output_format=output_format.value,
                    normalize=normalize,
                )

                logger.info(
                    "demucs_processing_started",
                    job_id=job_id,
                    model=model,
                    input=audio_path,
                    output_dir=output_dir,
                    command=cmd,
                )

                # Run demucs
                start_time = time.time()
                self._run_demucs_command(cmd, job_id, progress_callback)
                duration = time.time() - start_time

                # Find output stems
                stem_files = self._collect_stem_files(
                    output_dir=output_dir,
                    audio_path=audio_path,
                    output_format=output_format,
                )

                # Record metrics
                input_size = get_file_size(audio_path)
                input_metadata = get_audio_metadata(audio_path)

                Metrics.processing_duration.labels(
                    model=model,
                    status="success",
                ).observe(duration)

                logger.info(
                    "stem_separation_completed",
                    job_id=job_id,
                    model=model,
                    duration=duration,
                    input_size_mb=input_size / 1024 / 1024,
                    output_dir=output_dir,
                )

                return stem_files

            except Exception as e:
                logger.error(
                    "stem_separation_failed",
                    job_id=job_id,
                    model=model,
                    error=str(e),
                    exc_info=True,
                )

                Metrics.processing_duration.labels(
                    model=model,
                    status="failed",
                ).observe(time.time() - start_time if "start_time" in locals() else 0)

                raise StemSeparationError(
                    job_id=job_id,
                    reason=str(e),
                )

    def _build_demucs_command(
        self,
        audio_path: str,
        output_dir: str,
        model: str,
        output_format: str,
        normalize: bool,
    ) -> List[str]:
        """
        Build Demucs command line.

        Args:
            audio_path: Input audio path
            output_dir: Output directory
            model: Model name
            output_format: Output format
            normalize: Whether to normalize

        Returns:
            Command as list of strings
        """
        cmd = [
            "python",
            "-m",
            "demucs",
            "--two-stems=vocals",  # Separate into 4 stems
            "-n",
            model,
            "-o",
            output_dir,
            "--out-ext",
            output_format,
        ]

        # Add device flag
        if self.gpu_enabled:
            cmd.extend(["--device", "cuda"])
        else:
            cmd.extend(["--device", "cpu"])

        # Add normalization flag
        if not normalize:
            cmd.append("--no-normalize")

        # Add input file
        cmd.append(audio_path)

        return cmd

    def _run_demucs_command(
        self,
        cmd: List[str],
        job_id: str,
        progress_callback: Optional[callable] = None,
    ) -> None:
        """
        Run Demucs command with progress tracking.

        Args:
            cmd: Command to run
            job_id: Job identifier
            progress_callback: Optional progress callback

        Raises:
            DemucsProcessingError: If command fails
        """
        try:
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                universal_newlines=True,
            )

            # Track progress from stdout
            for line in process.stdout:
                logger.debug("demucs_output", job_id=job_id, line=line.strip())

                # Parse progress if available
                if progress_callback and "%" in line:
                    try:
                        # Extract percentage from output
                        progress = int(line.split("%")[0].strip().split()[-1])
                        progress_callback(progress)
                    except (ValueError, IndexError):
                        pass

            # Wait for completion
            return_code = process.wait()

            if return_code != 0:
                stderr = process.stderr.read()
                raise DemucsProcessingError(
                    message=f"Demucs processing failed with code {return_code}",
                    job_id=job_id,
                    return_code=return_code,
                    stderr=stderr,
                )

        except subprocess.SubprocessError as e:
            raise DemucsProcessingError(
                message=f"Failed to run Demucs: {str(e)}",
                job_id=job_id,
            )

    def _collect_stem_files(
        self,
        output_dir: str,
        audio_path: str,
        output_format: AudioFormat,
    ) -> StemFiles:
        """
        Collect information about separated stem files.

        Args:
            output_dir: Output directory
            audio_path: Original audio path
            output_format: Output format

        Returns:
            StemFiles with stem information

        Raises:
            DemucsProcessingError: If stems not found
        """
        # Demucs outputs to: output_dir/model_name/track_name/stem.format
        # Find the actual output directory
        base_name = Path(audio_path).stem

        # Search for stems in output directory
        stem_types = ["vocals", "drums", "bass", "other"]
        found_stems = {}

        # Look for stems in nested directories
        for root, dirs, files in os.walk(output_dir):
            for stem_type in stem_types:
                stem_file = f"{stem_type}.{output_format.value}"
                if stem_file in files:
                    stem_path = os.path.join(root, stem_file)
                    found_stems[stem_type] = self._create_stem_info(
                        stem_path=stem_path,
                        stem_type=stem_type,
                        output_format=output_format,
                    )

        # Validate all stems found
        if len(found_stems) != len(stem_types):
            missing = set(stem_types) - set(found_stems.keys())
            raise DemucsProcessingError(
                message=f"Missing stems: {missing}",
                output_dir=output_dir,
                found_stems=list(found_stems.keys()),
            )

        return StemFiles(
            vocals=found_stems["vocals"],
            drums=found_stems["drums"],
            bass=found_stems["bass"],
            other=found_stems["other"],
        )

    def _create_stem_info(
        self,
        stem_path: str,
        stem_type: str,
        output_format: AudioFormat,
    ) -> StemInfo:
        """
        Create StemInfo from file.

        Args:
            stem_path: Path to stem file
            stem_type: Type of stem (vocals, drums, bass, other)
            output_format: Audio format

        Returns:
            StemInfo instance
        """
        metadata = get_audio_metadata(stem_path)
        file_size = get_file_size(stem_path)

        return StemInfo(
            filename=os.path.basename(stem_path),
            path=stem_path,
            size=file_size,
            duration=metadata["duration"],
            format=output_format,
            sample_rate=metadata["sample_rate"],
            bitrate=None,  # WAV has no bitrate
            cdn_url=None,  # Set by CDN integration later
        )

    def get_available_models(self) -> List[str]:
        """
        Get list of available models.

        Returns:
            List of model names
        """
        return self._get_available_models()