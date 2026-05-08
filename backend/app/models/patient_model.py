"""
patient_model.py
────────────────
SQLAlchemy model for the Patient entity.
Represents an elderly family member whose health is being tracked.
"""

from datetime import date

from sqlalchemy import ARRAY, Date, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Patient(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """
    A patient (elderly relative) whose health data is tracked.

    Attributes:
        name: Full name of the patient.
        date_of_birth: Patient's date of birth.
        underlying_diseases: List of chronic conditions (e.g. ["DM", "HT", "DLP"]).
        hospital_name: Name of the local district hospital.
        hn_number: Hospital Number (เลข HN) for identification.
    """

    __tablename__ = "patients"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    date_of_birth: Mapped[date | None] = mapped_column(Date, nullable=True)
    underlying_diseases: Mapped[list[str] | None] = mapped_column(
        ARRAY(String), nullable=True, default=list
    )
    hospital_name: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    hn_number: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )

    # ── Relationships ────────────────────────────────────────
    family_members = relationship(
        "FamilyMember", back_populates="patient", cascade="all, delete-orphan"
    )
    health_logs = relationship(
        "HealthLog", back_populates="patient", cascade="all, delete-orphan",
        order_by="desc(HealthLog.measured_at)",
    )
    medications = relationship(
        "Medication", back_populates="patient", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Patient {self.name} (HN: {self.hn_number})>"
