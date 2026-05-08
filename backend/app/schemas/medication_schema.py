"""
medication_schema.py
────────────────────
Pydantic schemas for Medication validation.
Includes the AI extraction schema used as Gemini's response_schema for medicine bag stickers.
"""

import uuid
from datetime import datetime

from pydantic import BaseModel, Field


# ─────────────────────────────────────────────────────────────
# AI Extraction Schema (used by Gemini structured output)
# ─────────────────────────────────────────────────────────────

class MedicationAIExtract(BaseModel):
    """
    Structured output schema for Gemini AI extraction from medicine bag sticker photos.
    This schema is passed as response_schema to guarantee structured JSON output.
    """

    medicine_name: str = Field(..., description="Medicine name (Thai or English as printed)")
    dosage: str | None = Field(None, description="Dosage amount, e.g. '500mg', '1 เม็ด'")
    instruction_code: str | None = Field(
        None,
        description="Short instruction code: 'pc' (after meals), 'ac' (before meals), "
        "'hs' (bedtime), 'prn' (as needed), 'stat' (immediately)",
    )
    instruction_thai: str | None = Field(
        None,
        description="Full Thai instruction, e.g. 'รับประทานครั้งละ 1 เม็ด หลังอาหาร 3 เวลา'",
    )
    indication: str | None = Field(
        None,
        description="What condition/symptom this medicine treats, "
        "e.g. 'ลดความดันโลหิต', 'ควบคุมระดับน้ำตาลในเลือด'",
    )
    warning: str | None = Field(
        None,
        description="Side effects or warnings, "
        "e.g. 'ห้ามใช้ร่วมกับแอลกอฮอล์', 'อาจทำให้ง่วงนอน'",
    )
    current_quantity: int | None = Field(
        None, description="Number of pills/units in the bag"
    )
    unit: str | None = Field(
        None, description="Unit type, e.g. 'เม็ด', 'แคปซูล', 'ml', 'ซอง'"
    )


class MedicationBatchAIExtract(BaseModel):
    """Wrapper for extracting multiple medications from a single image."""

    medications: list[MedicationAIExtract] = Field(
        ..., description="List of all medications found in the image"
    )


# ─────────────────────────────────────────────────────────────
# API Request / Response Schemas
# ─────────────────────────────────────────────────────────────

class MedicationCreate(BaseModel):
    """Schema for creating a new medication entry via API."""

    patient_id: uuid.UUID
    medicine_name: str = Field(..., max_length=255)
    dosage: str | None = None
    instruction_code: str | None = None
    instruction_thai: str | None = None
    indication: str | None = None
    warning: str | None = None
    current_quantity: int | None = None
    unit: str | None = None
    is_active: bool = True


class MedicationResponse(BaseModel):
    """Schema for returning medication data in API responses."""

    id: uuid.UUID
    patient_id: uuid.UUID
    medicine_name: str
    dosage: str | None
    instruction_code: str | None
    instruction_thai: str | None
    indication: str | None
    warning: str | None
    current_quantity: int | None
    unit: str | None
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
