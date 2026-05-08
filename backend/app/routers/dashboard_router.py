from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
import logging

from app.database_config import get_db
from app.dependencies import get_current_user
from app.models.patient_model import Patient
from app.models.family_member_model import FamilyMember
from app.models.health_log_model import HealthLog

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])
logger = logging.getLogger(__name__)

@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Fetch summary statistics for the logged-in user.
    """
    user_id = current_user.get("sub")
    
    # Count patients
    patient_count_stmt = (
        select(func.count(Patient.id))
        .join(FamilyMember, FamilyMember.patient_id == Patient.id)
        .where(FamilyMember.user_id == user_id)
    )
    patient_count_result = await db.execute(patient_count_stmt)
    patient_count = patient_count_result.scalar() or 0

    # Count shared members
    # (First find user's patients, then find users for those patients)
    p_ids_stmt = select(FamilyMember.patient_id).where(FamilyMember.user_id == user_id)
    p_ids = (await db.execute(p_ids_stmt)).scalars().all()
    
    member_count = 0
    if p_ids:
        member_count_stmt = (
            select(func.count(func.distinct(FamilyMember.user_id)))
            .where(FamilyMember.patient_id.in_(p_ids))
        )
        member_count = (await db.execute(member_count_stmt)).scalar() or 0

    # Get user's primary patient ID
    from app.models.user_model import User
    user_stmt = select(User).where(User.id == user_id)
    user = (await db.execute(user_stmt)).scalars().first()
    primary_id = user.primary_patient_id if user else None

    # Count total health logs for these patients
    log_count = 0
    latest_log = None
    if p_ids:
        log_count_stmt = (
            select(func.count(HealthLog.id))
            .where(HealthLog.patient_id.in_(p_ids))
        )
        log_count = (await db.execute(log_count_stmt)).scalar() or 0
        
        # Get the latest log - prioritize primary patient
        latest_log_stmt = select(HealthLog)
        if primary_id:
            latest_log_stmt = latest_log_stmt.where(HealthLog.patient_id == primary_id)
        else:
            latest_log_stmt = latest_log_stmt.where(HealthLog.patient_id.in_(p_ids))
            
        latest_log_stmt = latest_log_stmt.order_by(HealthLog.measured_at.desc()).limit(1)
        
        latest_log_result = await db.execute(latest_log_stmt)
        latest_log = latest_log_result.scalars().first()
        
        # If primary patient has no logs yet, fallback to any patient's latest log
        if not latest_log and primary_id and p_ids:
            fallback_stmt = (
                select(HealthLog)
                .where(HealthLog.patient_id.in_(p_ids))
                .order_by(HealthLog.measured_at.desc())
                .limit(1)
            )
            latest_log = (await db.execute(fallback_stmt)).scalars().first()

    return {
        "total_patients": patient_count,
        "total_members": member_count,
        "total_logs": log_count,
        "active_alerts": 0,
        "latest_log": latest_log
    }
