"""
patient_schema.py
─────────────────
Pydantic schemas for Patient request/response validation.
"""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class PatientCreate(BaseModel):
    """Schema for creating a new patient."""

    name: str = Field(..., max_length=255, description="Patient full name")
    date_of_birth: date | None = Field(None, description="Date of birth")
    underlying_diseases: list[str] | None = Field(
        default=None,
        description="List of chronic conditions, e.g. ['DM', 'HT', 'DLP']",
    )
    hospital_name: str | None = Field(None, max_length=255)
    hn_number: str | None = Field(None, max_length=50, description="Hospital Number")
    birth_year_only: bool = Field(False)


class PatientResponse(BaseModel):
    """Schema for returning patient data in API responses."""

    id: uuid.UUID
    name: str
    date_of_birth: date | None
    underlying_diseases: list[str] | None
    hospital_name: str | None
    hn_number: str | None
    birth_year_only: bool
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None

    model_config = {"from_attributes": True}
