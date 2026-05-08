"""
family_member_model.py
──────────────────────
SQLAlchemy model for the FamilyMember association.
Maps the Many-to-Many relationship between User and Patient
with an extra 'relationship' field describing the family connection.
"""

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin


class FamilyMember(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    Association between a User and a Patient.
    Describes which users are tracking which patients.

    Attributes:
        user_id: FK to the users table.
        patient_id: FK to the patients table.
        relationship_label: The family relationship (e.g. "ลูก", "หลาน", "คู่สมรส").
    """

    __tablename__ = "family_members"

    user_id: Mapped["uuid.UUID"] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
    )
    patient_id: Mapped["uuid.UUID"] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
    )
    relationship_label: Mapped[str | None] = mapped_column(
        String(100), nullable=True, doc="e.g. ลูก, หลาน, คู่สมรส"
    )

    # ── Relationships ────────────────────────────────────────
    user = relationship("User", back_populates="family_members")
    patient = relationship("Patient", back_populates="family_members")

    def __repr__(self) -> str:
        return f"<FamilyMember user={self.user_id} → patient={self.patient_id}>"


# Required for type annotation
import uuid  # noqa: E402
