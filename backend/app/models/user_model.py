"""
user_model.py
─────────────
SQLAlchemy model for the User entity.
Represents a LINE user who accesses the system.
"""

import enum

from sqlalchemy import Enum, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin


class UserRole(str, enum.Enum):
    """Roles a user can have in the system."""
    FAMILY = "family"
    CAREGIVER = "caregiver"
    ADMIN = "admin"


class User(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A registered user identified by their LINE user ID.

    Attributes:
        line_user_id: Unique identifier from LINE platform.
        display_name: User's display name from LINE profile.
        role: User's role in the system (family, caregiver, admin).
        picture_url: URL to the user's LINE profile picture.
    """

    __tablename__ = "users"

    line_user_id: Mapped[str] = mapped_column(
        String(64), unique=True, index=True, nullable=False
    )
    display_name: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole), default=UserRole.FAMILY, nullable=False
    )
    picture_url: Mapped[str | None] = mapped_column(
        String(512), nullable=True
    )

    # ── Relationships ────────────────────────────────────────
    family_members = relationship(
        "FamilyMember", back_populates="user", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<User {self.display_name} ({self.line_user_id})>"
