"""
models/__init__.py
──────────────────
Re-exports all SQLAlchemy models for convenient imports.

Usage:
    from app.models import User, Patient, HealthLog, Medication, FamilyMember
"""

from app.models.base_model import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.user_model import User, UserRole
from app.models.patient_model import Patient
from app.models.family_member_model import FamilyMember
from app.models.health_log_model import HealthLog
from app.models.medication_model import Medication

__all__ = [
    "Base",
    "TimestampMixin",
    "UUIDPrimaryKeyMixin",
    "User",
    "UserRole",
    "Patient",
    "FamilyMember",
    "HealthLog",
    "Medication",
]
