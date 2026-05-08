"""
health_log_service.py
─────────────────────
Handles saving and retrieving health logs and medications.
"""

import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.health_log_model import HealthLog
from app.schemas.health_log_schema import HealthLogAIExtract

logger = logging.getLogger(__name__)

async def save_health_log(
    db: AsyncSession,
    patient_id: str,
    extracted_data: HealthLogAIExtract,
    image_url: str | None = None
) -> HealthLog:
    """
    Save extracted health data from AI into the database.
    """
    # 1. Prepare measured_at (Convert string to datetime)
    measured_at = datetime.now() # Default
    if extracted_data.measured_at:
        try:
            measured_at = datetime.fromisoformat(extracted_data.measured_at)
        except ValueError:
            logger.warning(f"Could not parse date: {extracted_data.measured_at}, using now()")

    # 2. Create model instance
    new_log = HealthLog(
        patient_id=patient_id,
        measured_at=measured_at,
        weight=extracted_data.weight,
        pulse=extracted_data.pulse,
        bp_1_sys=extracted_data.bp_1_sys,
        bp_1_dia=extracted_data.bp_1_dia,
        bp_2_sys=extracted_data.bp_2_sys,
        bp_2_dia=extracted_data.bp_2_dia,
        symptoms=extracted_data.symptoms,
        treatment_raw=extracted_data.treatment_raw,
        treatment_meds=[med.model_dump() for med in extracted_data.treatment_meds] if extracted_data.treatment_meds else [],
        next_appointment=datetime.fromisoformat(extracted_data.next_appointment).date() if extracted_data.next_appointment else None,
        image_url=image_url
    )

    db.add(new_log)
    await db.flush()
    logger.info(f"Health log saved for patient: {patient_id}")
    
    return new_log
