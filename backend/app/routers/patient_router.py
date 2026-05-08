from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.database_config import get_db
from app.dependencies import get_current_user
from app.models.patient_model import Patient
from app.models.family_member_model import FamilyMember
import uuid
from datetime import datetime

from pydantic import BaseModel
from typing import List, Optional
from datetime import date as date_type

router = APIRouter(prefix="/patient-management", tags=["Patients"])
logger = logging.getLogger(__name__)

class PatientCreate(BaseModel):
    name: str
    date_of_birth: Optional[date_type] = None
    underlying_diseases: Optional[List[str]] = []
    hospital_name: Optional[str] = None
    hn_number: Optional[str] = None
    birth_year_only: bool = False

@router.post("", status_code=201)
async def create_patient(
    patient_data: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new patient and link them to the current user.
    """
    user_id = uuid.UUID(current_user.get("sub"))
    
    # 1. Create Patient record
    new_patient = Patient(
        name=patient_data.name,
        date_of_birth=patient_data.date_of_birth,
        underlying_diseases=patient_data.underlying_diseases,
        hospital_name=patient_data.hospital_name,
        hn_number=patient_data.hn_number,
        birth_year_only=patient_data.birth_year_only
    )
    db.add(new_patient)
    await db.flush() # Get the new patient ID
    
    # 2. Link to current user as a family member
    new_link = FamilyMember(
        user_id=user_id,
        patient_id=new_patient.id,
        relationship_label="Creator"
    )
    db.add(new_link)

    # 3. If user has no primary patient, set this one as primary
    from app.models.user_model import User
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    if user and not user.primary_patient_id:
        user.primary_patient_id = str(new_patient.id)
    
    await db.commit()
    await db.refresh(new_patient)
    
    return new_patient

@router.get("")
async def list_patients(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List all patients associated with the logged-in user.
    """
    user_id = uuid.UUID(current_user.get("sub"))
    
    # Query patients linked to this user via FamilyMember table
    stmt = (
        select(Patient)
        .join(FamilyMember, FamilyMember.patient_id == Patient.id)
        .where(FamilyMember.user_id == user_id, Patient.deleted_at == None)
    )
    
    result = await db.execute(stmt)
    patients = result.scalars().all()
    
    return patients

@router.get("/{patient_id}")
async def get_patient_detail(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get detailed info for a specific patient.
    Checks if the user has access to this patient.
    """
    user_id = uuid.UUID(current_user.get("sub"))
    
    # Check permission
    perm_stmt = select(FamilyMember).where(
        FamilyMember.user_id == user_id,
        FamilyMember.patient_id == patient_id
    )
    perm_result = await db.execute(perm_stmt)
    if not perm_result.scalars().first():
        raise HTTPException(status_code=403, detail="You do not have access to this patient")

    # Fetch patient
    result = await db.execute(select(Patient).where(Patient.id == patient_id, Patient.deleted_at == None))
    patient = result.scalars().first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
        
    return patient

@router.put("/{patient_id}")
async def update_patient(
    patient_id: uuid.UUID,
    patient_data: PatientCreate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Update an existing patient's information.
    Checks if the user has access before updating.
    """
    user_id = uuid.UUID(current_user.get("sub"))
    
    # Check permission via FamilyMember table
    perm_stmt = select(FamilyMember).where(
        FamilyMember.user_id == user_id,
        FamilyMember.patient_id == patient_id
    )
    perm_result = await db.execute(perm_stmt)
    if not perm_result.scalars().first():
        raise HTTPException(status_code=403, detail="You do not have access to update this patient")

    # Fetch patient
    result = await db.execute(select(Patient).where(Patient.id == patient_id, Patient.deleted_at == None))
    patient = result.scalars().first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Update fields
    patient.name = patient_data.name
    patient.date_of_birth = patient_data.date_of_birth
    patient.hospital_name = patient_data.hospital_name
    patient.hn_number = patient_data.hn_number
    patient.underlying_diseases = patient_data.underlying_diseases
    patient.birth_year_only = patient_data.birth_year_only
    
    await db.commit()
    await db.refresh(patient)
    
    return patient

@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Soft delete a patient.
    Checks if the user has access before deleting.
    """
    user_id = uuid.UUID(current_user.get("sub"))
    
    # Check permission
    perm_stmt = select(FamilyMember).where(
        FamilyMember.user_id == user_id,
        FamilyMember.patient_id == patient_id
    )
    perm_result = await db.execute(perm_stmt)
    if not perm_result.scalars().first():
        raise HTTPException(status_code=403, detail="You do not have access to delete this patient")

    # Fetch patient
    result = await db.execute(select(Patient).where(Patient.id == patient_id, Patient.deleted_at == None))
    patient = result.scalars().first()
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found or already deleted")
    
    from sqlalchemy import func
    # Soft delete
    patient.deleted_at = func.now()
    
    await db.commit()
    
    return {"message": "Patient deleted successfully"}
