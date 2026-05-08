"""
health_log_model.py
───────────────────
SQLAlchemy model for health log entries.
Each record represents one visit / measurement entry from an NCD notebook.
"""

import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin


class HealthLog(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A single health measurement entry extracted from a hospital NCD notebook.

    Attributes:
        patient_id: FK to the patient being tracked.
        measured_at: Date/time when the measurement was taken.
        weight: Body weight in kilograms.
        pulse: Pulse rate in bpm.
        bp_1_sys / bp_1_dia: First blood pressure reading (systolic / diastolic).
        bp_2_sys / bp_2_dia: Second blood pressure reading (systolic / diastolic).
        symptoms: Symptoms noted during the visit.
        treatment_raw: Raw OCR text of treatment/prescriptions.
        treatment_meds: Structured JSONB list of medications prescribed.
        next_appointment: Date of the next scheduled appointment.
        image_url: Path/URL to the source image used for OCR.
    """

    __tablename__ = "health_logs"

    patient_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("patients.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # ── Vital Signs ──────────────────────────────────────────
    measured_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False
    )
    weight: Mapped[float | None] = mapped_column(Float, nullable=True)
    pulse: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Blood Pressure — 1st reading
    bp_1_sys: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bp_1_dia: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Blood Pressure — 2nd reading
    bp_2_sys: Mapped[int | None] = mapped_column(Integer, nullable=True)
    bp_2_dia: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # ── Clinical Notes ───────────────────────────────────────
    symptoms: Mapped[str | None] = mapped_column(Text, nullable=True)
    treatment_raw: Mapped[str | None] = mapped_column(Text, nullable=True)
    treatment_meds: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    next_appointment: Mapped[date | None] = mapped_column(Date, nullable=True)

    # ── Source ───────────────────────────────────────────────
    image_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    # ── Relationships ────────────────────────────────────────
    patient = relationship("Patient", back_populates="health_logs")

    def __repr__(self) -> str:
        return f"<HealthLog patient={self.patient_id} at={self.measured_at}>"
