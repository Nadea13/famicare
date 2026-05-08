"""
storage_service.py
──────────────────
Modular file storage service.
Currently stores files on the local filesystem.
Designed to be easily swapped for S3-compatible storage (e.g. Cloudflare R2).
"""

import logging
import os
import uuid
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path

import aiofiles

from app.dependencies import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class BaseStorageService(ABC):
    """
    Abstract base class for storage services.
    Implement this interface to swap storage backends.
    """

    @abstractmethod
    async def save(self, data: bytes, filename: str, content_type: str = "image/jpeg") -> str:
        """
        Save file data and return the URL/path to access it.

        Args:
            data: Raw file bytes.
            filename: Original filename (may be modified for uniqueness).
            content_type: MIME type of the file.

        Returns:
            URL or path string to access the saved file.
        """
        ...

    @abstractmethod
    async def delete(self, file_path: str) -> bool:
        """
        Delete a file by its URL/path.

        Returns:
            True if deleted successfully, False otherwise.
        """
        ...

    @abstractmethod
    async def get(self, file_path: str) -> bytes | None:
        """
        Retrieve file data by its URL/path.

        Returns:
            File bytes if found, None otherwise.
        """
        ...


class LocalStorageService(BaseStorageService):
    """
    Local filesystem storage implementation.
    Stores files in the configured UPLOAD_DIR directory.

    Files are organized by date: uploads/2025/03/15/<uuid>_<filename>
    """

    def __init__(self) -> None:
        self.base_dir = Path(settings.UPLOAD_DIR).resolve()
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def _generate_path(self, filename: str) -> Path:
        """Generate a unique, date-organized file path."""
        today = datetime.now()
        date_dir = self.base_dir / str(today.year) / f"{today.month:02d}" / f"{today.day:02d}"
        date_dir.mkdir(parents=True, exist_ok=True)

        # Add UUID prefix for uniqueness
        unique_name = f"{uuid.uuid4().hex[:8]}_{filename}"
        return date_dir / unique_name

    async def save(self, data: bytes, filename: str, content_type: str = "image/jpeg") -> str:
        """Save file to local filesystem and return relative path."""
        file_path = self._generate_path(filename)

        async with aiofiles.open(file_path, "wb") as f:
            await f.write(data)

        # Return path relative to base dir for portability
        relative_path = str(file_path.relative_to(self.base_dir))
        logger.info(f"File saved: {relative_path} ({len(data)} bytes)")
        return relative_path

    async def delete(self, file_path: str) -> bool:
        """Delete a file from local filesystem."""
        full_path = self.base_dir / file_path
        if full_path.exists():
            os.remove(full_path)
            logger.info(f"File deleted: {file_path}")
            return True
        logger.warning(f"File not found for deletion: {file_path}")
        return False

    async def get(self, file_path: str) -> bytes | None:
        """Read file bytes from local filesystem."""
        full_path = self.base_dir / file_path
        if not full_path.exists():
            logger.warning(f"File not found: {file_path}")
            return None

        async with aiofiles.open(full_path, "rb") as f:
            return await f.read()


# ─────────────────────────────────────────────────────────────
# Factory — swap this to change storage backend
# ─────────────────────────────────────────────────────────────

def get_storage_service() -> BaseStorageService:
    """
    Factory function to get the active storage service.

    To swap to S3-compatible storage (e.g. Cloudflare R2):
    1. Create a class like R2StorageService(BaseStorageService)
    2. Return it here instead of LocalStorageService
    """
    return LocalStorageService()
