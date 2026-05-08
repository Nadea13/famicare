"""
medication_model.py
───────────────────
SQLAlchemy model for patient medications.
Each record represents a single medication extracted from a medicine bag sticker.
"""

import uuid

from sqlalchemy import Boolean, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Medication(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A medication entry extracted from a medicine bag sticker photo.

    Attributes:
        patient_id: FK to the patient.
        medicine_name: Name of the medicine (Thai or English).
        dosage: Dosage amount (e.g. "500mg", "1 เม็ด").
        instruction_code: Short code (e.g. "pc", "ac", "hs").
        instruction_thai: Thai language instruction (e.g. "หลังอาหาร 3 เวลา").
        indication: What the medicine treats / is prescribed for.
        warning: Side effects or contraindication warnings.
        current_quantity: Number of pills/units remaining.
        unit: Unit of measurement (e.g. "เม็ด", "แคปซูล", "ml").
        is_active: Whether this medication is currently being taken.
    """

    __tablename__ = "medications"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    medicine_name: Mapped[str] = mapped_column(String(255), nullable=False)
    dosage: Mapped[str | None] = mapped_column(String(100), nullable=True)
    instruction_code: Mapped[str | None] = mapped_column(
        String(20), nullable=True, doc="e.g. pc, ac, hs"
    )
    instruction_thai: Mapped[str | None] = mapped_column(
        String(255), nullable=True, doc="e.g. หลังอาหาร 3 เวลา"
    )
    indication: Mapped[str | None] = mapped_column(Text, nullable=True)
    warning: Mapped[str | None] = mapped_column(Text, nullable=True)
    current_quantity: Mapped[int | None] = mapped_column(Integer, nullable=True)
    unit: Mapped[str | None] = mapped_column(
        String(50), nullable=True, doc="e.g. เม็ด, แคปซูล"
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # ── Relationships ────────────────────────────────────────
    patient = relationship("Patient", back_populates="medications")

    def __repr__(self) -> str:
        return f"<Medication {self.medicine_name} ({self.dosage})>"
