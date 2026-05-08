"""
schemas/__init__.py
───────────────────
Re-exports all Pydantic schemas for convenient imports.

Usage:
    from app.schemas import HealthLogCreate, HealthLogResponse, HealthLogAIExtract
"""

from app.schemas.user_schema import UserCreate, UserResponse
from app.schemas.patient_schema import PatientCreate, PatientResponse
from app.schemas.health_log_schema import (
    HealthLogAIExtract,
    HealthLogCreate,
    HealthLogResponse,
    TreatmentMedItem,
)
from app.schemas.medication_schema import (
    MedicationAIExtract,
    MedicationBatchAIExtract,
    MedicationCreate,
    MedicationResponse,
)

__all__ = [
    "UserCreate",
    "UserResponse",
    "PatientCreate",
    "PatientResponse",
    "HealthLogAIExtract",
    "HealthLogCreate",
    "HealthLogResponse",
    "TreatmentMedItem",
    "MedicationAIExtract",
    "MedicationBatchAIExtract",
    "MedicationCreate",
    "MedicationResponse",
]
