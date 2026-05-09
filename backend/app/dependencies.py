"""
dependencies.py
───────────────
Application settings loaded from environment variables via pydantic-settings.
Provides a cached singleton so settings are read once at startup.
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    All application configuration.
    Values are read from a .env file or OS environment variables.
    """

    model_config = SettingsConfigDict(
        env_file=(".env", ".env.local"),
        env_file_encoding="utf-8",
        case_sensitive=True,
    )

    # ── Database ─────────────────────────────────────────────
    DATABASE_URL: str = "postgresql+asyncpg://famicare:famicare_secret@localhost:5432/famicare_db"

    # ── LINE Messaging API ───────────────────────────────────
    LINE_CHANNEL_SECRET: str = ""
    LINE_CHANNEL_ACCESS_TOKEN: str = ""
    LINE_BOT_ID: str = "" # e.g. @famicare

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

    # ── Authentication ───────────────────────────────────────
    JWT_SECRET: str = "super_secret_key_change_me_in_production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days


@lru_cache
def get_settings() -> Settings:
    """Returns a cached Settings singleton."""
    return Settings()


# ── Auth Dependency ───────────────────────────────────────────
security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    settings: Settings = Depends(get_settings)
) -> dict:
    """
    Dependency to validate JWT token and return the payload.
    """
    from app.services.auth_service import verify_token
    
    token = credentials.credentials
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return payload
