from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import logging

from app.database_config import get_db
from app.dependencies import get_current_user
from app.models.family_member_model import FamilyMember
from app.models.user_model import User

router = APIRouter(prefix="/members", tags=["Members"])
logger = logging.getLogger(__name__)

@router.get("")
async def list_family_members(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List all family members who share access to the same patients as the current user.
    """
    user_id = current_user.get("sub")
    
    # 1. Find all patients this user manages
    patient_ids_stmt = select(FamilyMember.patient_id).where(FamilyMember.user_id == user_id)
    patient_ids_result = await db.execute(patient_ids_stmt)
    patient_ids = patient_ids_result.scalars().all()
    
    # 2. Find all users linked to these patients
    # We always include the current user by default
    stmt = select(User).where(User.id == user_id, User.deleted_at == None)
    
    if patient_ids:
        # If they have patients, find all OTHER users linked to those same patients
        stmt = (
            select(User)
            .join(FamilyMember, FamilyMember.user_id == User.id)
            .where(FamilyMember.patient_id.in_(patient_ids), User.deleted_at == None)
            .distinct()
        )
    
    result = await db.execute(stmt)
    members = result.scalars().all()
    
    return members
