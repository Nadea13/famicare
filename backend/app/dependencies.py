"""
dependencies.py
───────────────
Application settings loaded from environment variables via pydantic-settings.
Provides a cached singleton so settings are read once at startup.
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    All application configuration.
    Values are read from a .env file or OS environment variables.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # ── Database ─────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://famicare:famicare_secret@localhost:5432/famicare_db"

    # ── LINE Messaging API ───────────────────────────────────
    LINE_CHANNEL_SECRET: str = ""
    LINE_CHANNEL_ACCESS_TOKEN: str = ""

    # ── LINE Login (OAuth) ───────────────────────────────────
    LINE_LOGIN_CHANNEL_ID: str = ""
    LINE_LOGIN_CHANNEL_SECRET: str = ""
    LINE_LOGIN_REDIRECT_URI: str = "http://localhost:3000/api/auth/callback"

    # ── Google Gemini AI ─────────────────────────────────────
    GOOGLE_API_KEY: str = ""

    # ── Application ──────────────────────────────────────────
    APP_ENV: str = "development"
    BACKEND_URL: str = "http://localhost:8000"
    FRONTEND_URL: str = "http://localhost:3000"

    # ── File Storage ─────────────────────────────────────────
    UPLOAD_DIR: str = "./uploads"


@lru_cache
def get_settings() -> Settings:
    """Returns a cached Settings singleton."""
    return Settings()
