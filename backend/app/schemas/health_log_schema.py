"""
health_log_schema.py
────────────────────
Pydantic schemas for HealthLog validation.
Includes the AI extraction schema used as Gemini's response_schema.
"""

import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────
# AI Extraction Schema (used by Gemini structured output)
# ─────────────────────────────────────────────────────────────

class TreatmentMedItem(BaseModel):
    """A single medication mentioned in treatment notes."""

    medicine_name: str = Field(..., description="Name of the prescribed medicine")
    dosage: str | None = Field(None, description="Dosage, e.g. '500mg 1x3'")
    instruction: str | None = Field(None, description="Usage instruction in Thai")


class HealthLogAIExtract(BaseModel):
    """
    Structured output schema for Gemini AI extraction from NCD notebook photos.
    This schema is passed as response_schema to guarantee structured JSON output.
    """

    measured_at: str | None = Field(
        None,
        description="Date of measurement in ISO 8601 format (YYYY-MM-DD). "
        "Convert from Buddhist Era (พ.ศ.) to Common Era (ค.ศ.) by subtracting 543.",
    )
    weight: float | None = Field(None, description="Body weight in kg")
    pulse: int | None = Field(None, description="Pulse rate in bpm")
    bp_1_sys: int | None = Field(None, description="1st BP reading — systolic (mmHg)")
    bp_1_dia: int | None = Field(None, description="1st BP reading — diastolic (mmHg)")
    bp_2_sys: int | None = Field(None, description="2nd BP reading — systolic (mmHg)")
    bp_2_dia: int | None = Field(None, description="2nd BP reading — diastolic (mmHg)")
    symptoms: str | None = Field(None, description="Symptoms noted during visit")
    treatment_raw: str | None = Field(
        None, description="Raw text of treatment/prescriptions as written"
    )
    treatment_meds: list[TreatmentMedItem] | None = Field(
        None, description="Structured list of medications from treatment notes"
    )
    next_appointment: str | None = Field(
        None,
        description="Next appointment date in ISO 8601 format (YYYY-MM-DD). "
        "Convert from พ.ศ. to ค.ศ.",
    )


# ─────────────────────────────────────────────────────────────
# API Request / Response Schemas
# ─────────────────────────────────────────────────────────────

class HealthLogCreate(BaseModel):
    """Schema for creating a new health log entry via API."""

    patient_id: uuid.UUID
    measured_at: datetime
    weight: float | None = None
    pulse: int | None = None
    bp_1_sys: int | None = None
    bp_1_dia: int | None = None
    bp_2_sys: int | None = None
    bp_2_dia: int | None = None
    symptoms: str | None = None
    treatment_raw: str | None = None
    treatment_meds: list[TreatmentMedItem] | None = None
    next_appointment: date | None = None
    image_url: str | None = None


class HealthLogResponse(BaseModel):
    """Schema for returning health log data in API responses."""

    id: uuid.UUID
    patient_id: uuid.UUID
    measured_at: datetime
    weight: float | None
    pulse: int | None
    bp_1_sys: int | None
    bp_1_dia: int | None
    bp_2_sys: int | None
    bp_2_dia: int | None
    symptoms: str | None
    treatment_raw: str | None
    treatment_meds: dict | None
    next_appointment: date | None
    image_url: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
