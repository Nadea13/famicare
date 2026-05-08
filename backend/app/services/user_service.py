"""
user_service.py
───────────────
Handles user registration, profile updates, and patient linking
for users coming from LINE Messaging API.
"""

import logging
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_model import User, UserRole
from app.models.patient_model import Patient
from app.models.family_member_model import FamilyMember

logger = logging.getLogger(__name__)

async def get_or_create_line_user(
    db: AsyncSession, 
    line_user_id: str, 
    display_name: str | None = None,
    picture_url: str | None = None
) -> User:
    """
    Find a user by their LINE ID. If not found, create a new one.
    """
    # 1. Search for existing user
    stmt = select(User).where(User.line_user_id == line_user_id, User.deleted_at == None)
    result = await db.execute(stmt)
    user = result.scalars().first()

    if user:
        # Update profile info if changed
        if display_name and user.display_name != display_name:
            user.display_name = display_name
        if picture_url and user.picture_url != picture_url:
            user.picture_url = picture_url
        return user

    # 2. Create new user if not found
    logger.info(f"Creating new user for LINE ID: {line_user_id}")
    new_user = User(
        line_user_id=line_user_id,
        display_name=display_name or "LINE User",
        picture_url=picture_url,
        role=UserRole.FAMILY
    )
    db.add(new_user)
    await db.flush() # Get the ID without committing yet
    
    return new_user

async def get_patient_for_user(db: AsyncSession, user_id: str) -> Patient | None:
    """
    Get the patient associated with this user.
    For MVP, we assume a 1:1 relationship or take the first one.
    """
    stmt = (
        select(Patient)
        .join(FamilyMember, FamilyMember.patient_id == Patient.id)
        .where(FamilyMember.user_id == user_id, Patient.deleted_at == None)
    )
    result = await db.execute(stmt)
    return result.scalars().first()

async def create_default_patient(db: AsyncSession, user: User, patient_name: str | None = None) -> Patient:
    """
    Create a default patient and link it to the user.
    Used when a new user joins and doesn't have a patient profile yet.
    """
    new_patient = Patient(
        name=patient_name or f"ญาติของ {user.display_name}",
        underlying_diseases=[]
    )
    db.add(new_patient)
    await db.flush()
    
    # Link user to patient
    link = FamilyMember(
        user_id=user.id,
        patient_id=new_patient.id,
        relationship_label="ดูแล"
    )
    db.add(link)
    await db.flush()
    
    return new_patient
