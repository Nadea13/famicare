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
    patient_id: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List family members. If patient_id is provided, lists members for that patient.
    Otherwise, lists all members shared across all patients of the current user.
    """
    user_id = current_user.get("sub")
    
    if patient_id:
        # Filter by specific patient
        stmt = (
            select(User, FamilyMember.role, FamilyMember.relationship_label)
            .join(FamilyMember, FamilyMember.user_id == User.id)
            .where(FamilyMember.patient_id == patient_id, User.deleted_at == None)
        )
    else:
        # Find all patients this user manages
        patient_ids_stmt = select(FamilyMember.patient_id).where(FamilyMember.user_id == user_id)
        patient_ids_result = await db.execute(patient_ids_stmt)
        patient_ids = patient_ids_result.scalars().all()
        
        if not patient_ids:
            # User has no patients, just return themselves
            result = await db.execute(select(User).where(User.id == user_id))
            return result.scalars().all()

        stmt = (
            select(User)
            .join(FamilyMember, FamilyMember.user_id == User.id)
            .where(FamilyMember.patient_id.in_(patient_ids), User.deleted_at == None)
            .distinct()
        )
    
    result = await db.execute(stmt)
    if patient_id:
        # Return user objects with an added role and relationship field
        rows = result.all()
        members = []
        for user, role, rel in rows:
            members.append({
                "id": user.id,
                "display_name": user.display_name,
                "picture_url": user.picture_url,
                "role": role,
                "relationship": rel
            })
        return members
    else:
        return result.scalars().all()

@router.post("/invite")
async def create_invite(
    invite_data: dict, # {patient_id: str, role: str}
    current_user: dict = Depends(get_current_user)
):
    """
    Generate an invitation token.
    """
    from app.services.invitation_service import create_invitation_token
    from app.dependencies import get_settings
    
    patient_id = invite_data.get("patient_id")
    role = invite_data.get("role", "viewer")
    
    if not patient_id:
        raise HTTPException(status_code=400, detail="Patient ID is required")
    
    token = create_invitation_token(patient_id, role)
    settings = get_settings()
    
    # Construct LINE OA deep link with start parameter
    line_link = f"https://line.me/R/ti/p/{settings.LINE_BOT_ID}?from=external&openExternalBrowser=1&start={token}"
    
    return {
        "token": token,
        "line_link": line_link,
        "join_url": f"{settings.FRONTEND_URL}/join?token={token}"
    }

@router.post("/join")
async def join_family(
    join_data: dict, # {token: str}
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Join a family using an invitation token.
    """
    from app.services.invitation_service import verify_invitation_token
    import uuid
    
    token = join_data.get("token")
    if not token:
        raise HTTPException(status_code=400, detail="Token is required")
    
    payload = verify_invitation_token(token)
    if not payload:
        raise HTTPException(status_code=400, detail="Invalid or expired invitation token")
    
    user_id = uuid.UUID(current_user.get("sub"))
    patient_id = uuid.UUID(payload.get("patient_id"))
    role = payload.get("role", "viewer")
    
    # Check if already a member
    existing_stmt = select(FamilyMember).where(
        FamilyMember.user_id == user_id,
        FamilyMember.patient_id == patient_id
    )
    existing_result = await db.execute(existing_stmt)
    if existing_result.scalars().first():
        return {"message": "You are already a member of this family"}
    
    # Add to family
    new_member = FamilyMember(
        user_id=user_id,
        patient_id=patient_id,
        role=role,
        relationship_label="สมาชิกครอบครัว" # Default label
    )
    db.add(new_member)
    
    # Update user's primary patient if they don't have one
    from app.models.user_model import User
    user_stmt = select(User).where(User.id == user_id)
    user_result = await db.execute(user_stmt)
    user = user_result.scalars().first()
    if user and not user.primary_patient_id:
        user.primary_patient_id = str(patient_id)
    
    await db.commit()
    
    return {"message": "Successfully joined the family", "patient_id": str(patient_id)}
