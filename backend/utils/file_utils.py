"""
File system utilities for temporary directory management and file operations.
"""

import os
import shutil
import tempfile
import uuid
from pathlib import Path
from typing import Optional

from backend.core.exceptions import FileValidationError
from backend.core.logging import get_logger

logger = get_logger(__name__)


def create_temp_directory(prefix: str = "demucs_") -> str:
    """
    Create a temporary directory for job processing.

    Args:
        prefix: Directory name prefix

    Returns:
        Path to created temporary directory

    Raises:
        OSError: If directory creation fails
    """
    try:
        temp_dir = tempfile.mkdtemp(prefix=prefix)
        logger.info("temp_directory_created", path=temp_dir)
        return temp_dir
    except OSError as e:
        logger.error("temp_directory_creation_failed", error=str(e))
        raise


def cleanup_directory(directory_path: str, ignore_errors: bool = True) -> None:
    """
    Remove directory and all its contents.

    Args:
        directory_path: Path to directory to remove
        ignore_errors: If True, ignore errors during removal

    Raises:
        OSError: If removal fails and ignore_errors is False
    """
    try:
        if os.path.exists(directory_path):
            shutil.rmtree(directory_path, ignore_errors=ignore_errors)
            logger.info("directory_cleaned_up", path=directory_path)
        else:
            logger.debug("directory_not_found_for_cleanup", path=directory_path)
    except OSError as e:
        logger.error("directory_cleanup_failed", path=directory_path, error=str(e))
        if not ignore_errors:
            raise


def get_file_size(file_path: str) -> int:
    """
    Get file size in bytes.

    Args:
        file_path: Path to file

    Returns:
        File size in bytes

    Raises:
        FileValidationError: If file doesn't exist or can't be read
    """
    try:
        size = os.path.getsize(file_path)
        return size
    except OSError as e:
        raise FileValidationError(
            message=f"Cannot read file: {str(e)}",
            filename=os.path.basename(file_path),
        )


def validate_file_path(file_path: str) -> None:
    """
    Validate that file exists and is readable.

    Args:
        file_path: Path to file

    Raises:
        FileValidationError: If file doesn't exist or isn't readable
    """
    if not os.path.exists(file_path):
        raise FileValidationError(
            message="File does not exist",
            filename=os.path.basename(file_path),
            path=file_path,
        )

    if not os.path.isfile(file_path):
        raise FileValidationError(
            message="Path is not a file",
            filename=os.path.basename(file_path),
            path=file_path,
        )

    if not os.access(file_path, os.R_OK):
        raise FileValidationError(
            message="File is not readable",
            filename=os.path.basename(file_path),
            path=file_path,
        )


def generate_unique_filename(original_filename: str, extension: Optional[str] = None) -> str:
    """
    Generate a unique filename based on original name.

    Args:
        original_filename: Original filename
        extension: Optional extension to use (without dot)

    Returns:
        Unique filename with UUID prefix
    """
    name = Path(original_filename).stem
    ext = extension or Path(original_filename).suffix.lstrip(".")
    unique_id = str(uuid.uuid4())[:8]
    return f"{unique_id}_{name}.{ext}"


def ensure_directory_exists(directory_path: str) -> None:
    """
    Ensure directory exists, creating it if necessary.

    Args:
        directory_path: Path to directory

    Raises:
        OSError: If directory creation fails
    """
    try:
        os.makedirs(directory_path, exist_ok=True)
    except OSError as e:
        logger.error("directory_creation_failed", path=directory_path, error=str(e))
        raise


def copy_file(source: str, destination: str) -> None:
    """
    Copy file from source to destination.

    Args:
        source: Source file path
        destination: Destination file path

    Raises:
        FileValidationError: If copy fails
    """
    try:
        shutil.copy2(source, destination)
        logger.debug("file_copied", source=source, destination=destination)
    except OSError as e:
        raise FileValidationError(
            message=f"Failed to copy file: {str(e)}",
            filename=os.path.basename(source),
        )


def get_directory_size(directory_path: str) -> int:
    """
    Calculate total size of all files in directory.

    Args:
        directory_path: Path to directory

    Returns:
        Total size in bytes
    """
    total_size = 0
    for dirpath, dirnames, filenames in os.walk(directory_path):
        for filename in filenames:
            file_path = os.path.join(dirpath, filename)
            try:
                total_size += os.path.getsize(file_path)
            except OSError:
                logger.warning("file_size_check_failed", path=file_path)
                continue
    return total_size


def list_files_in_directory(directory_path: str, extension: Optional[str] = None) -> list[str]:
    """
    List all files in directory, optionally filtered by extension.

    Args:
        directory_path: Path to directory
        extension: Optional file extension to filter (e.g., '.wav')

    Returns:
        List of file paths
    """
    files = []
    try:
        for filename in os.listdir(directory_path):
            file_path = os.path.join(directory_path, filename)
            if os.path.isfile(file_path):
                if extension is None or filename.endswith(extension):
                    files.append(file_path)
        return files
    except OSError as e:
        logger.error("directory_listing_failed", path=directory_path, error=str(e))
        return []