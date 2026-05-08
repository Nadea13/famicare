"""
user_schema.py
──────────────
Pydantic schemas for User request/response validation.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.user_model import UserRole


class UserCreate(BaseModel):
    """Schema for creating a new user (from LINE login)."""

    line_user_id: str = Field(..., max_length=64, description="LINE platform user ID")
    display_name: str | None = Field(None, max_length=255)
    picture_url: str | None = Field(None, max_length=512)
    role: UserRole = Field(default=UserRole.FAMILY)


class UserResponse(BaseModel):
    """Schema for returning user data in API responses."""

    id: uuid.UUID
    line_user_id: str
    display_name: str | None
    role: UserRole
    picture_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
