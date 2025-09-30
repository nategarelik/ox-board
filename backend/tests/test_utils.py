"""
Tests for utility modules.
"""

import os
import tempfile

import pytest

from backend.core.exceptions import (
    FileValidationError,
    FileTooLargeError,
    UnsupportedFormatError,
    ValidationError,
)
from backend.utils.file_utils import (
    cleanup_directory,
    create_temp_directory,
    ensure_directory_exists,
    generate_unique_filename,
    get_file_size,
)
from backend.utils.validation import (
    validate_model_name,
    validate_output_format,
    validate_youtube_url,
)


class TestFileUtils:
    """Tests for file utilities."""

    def test_create_temp_directory(self):
        """Test temporary directory creation."""
        temp_dir = create_temp_directory(prefix="test_")

        assert os.path.exists(temp_dir)
        assert os.path.isdir(temp_dir)
        assert "test_" in temp_dir

        # Cleanup
        cleanup_directory(temp_dir)

    def test_cleanup_directory(self):
        """Test directory cleanup."""
        temp_dir = create_temp_directory()

        # Create a file in directory
        test_file = os.path.join(temp_dir, "test.txt")
        with open(test_file, "w") as f:
            f.write("test")

        cleanup_directory(temp_dir)
        assert not os.path.exists(temp_dir)

    def test_ensure_directory_exists(self):
        """Test directory creation."""
        with tempfile.TemporaryDirectory() as temp_dir:
            new_dir = os.path.join(temp_dir, "new_directory")

            ensure_directory_exists(new_dir)
            assert os.path.exists(new_dir)
            assert os.path.isdir(new_dir)

    def test_generate_unique_filename(self):
        """Test unique filename generation."""
        filename = generate_unique_filename("test.mp3")

        assert filename.endswith(".mp3")
        assert "test" in filename
        assert len(filename) > len("test.mp3")  # Has UUID prefix

    def test_get_file_size(self):
        """Test file size retrieval."""
        with tempfile.NamedTemporaryFile(delete=False) as f:
            f.write(b"test content")
            temp_path = f.name

        try:
            size = get_file_size(temp_path)
            assert size == 12  # len("test content")
        finally:
            os.unlink(temp_path)

    def test_get_file_size_nonexistent(self):
        """Test file size with nonexistent file."""
        with pytest.raises(FileValidationError):
            get_file_size("/nonexistent/file.txt")


class TestValidation:
    """Tests for validation utilities."""

    def test_validate_model_name_valid(self):
        """Test valid model names."""
        valid_models = ["htdemucs", "htdemucs_ft", "mdx_extra", "mdx_extra_q"]

        for model in valid_models:
            validate_model_name(model)  # Should not raise

    def test_validate_model_name_invalid(self):
        """Test invalid model name."""
        with pytest.raises(ValidationError):
            validate_model_name("invalid_model")

    def test_validate_output_format_valid(self):
        """Test valid output formats."""
        valid_formats = ["wav", "mp3", "flac"]

        for fmt in valid_formats:
            validate_output_format(fmt)  # Should not raise

    def test_validate_output_format_invalid(self):
        """Test invalid output format."""
        with pytest.raises(ValidationError):
            validate_output_format("invalid")

    def test_validate_youtube_url_valid(self):
        """Test valid YouTube URLs."""
        valid_urls = [
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
            "https://youtu.be/dQw4w9WgXcQ",
            "https://www.youtube.com/embed/dQw4w9WgXcQ",
        ]

        for url in valid_urls:
            result = validate_youtube_url(url)
            assert result["valid"] is True
            assert result["video_id"] == "dQw4w9WgXcQ"

    def test_validate_youtube_url_invalid(self):
        """Test invalid YouTube URL."""
        with pytest.raises(ValidationError):
            validate_youtube_url("https://not-youtube.com/video")