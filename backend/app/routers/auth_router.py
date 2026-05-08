"""
auth_router.py
──────────────
Handles LINE Login OAuth flow.
Exchanges authorization codes for JWT tokens to secure the dashboard.
"""

import logging
import httpx
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from fastapi.responses import RedirectResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from urllib.parse import urlencode

from app.dependencies import get_settings, get_current_user
from app.database_config import get_db
from app.services.auth_service import create_access_token
from app.services.user_service import get_or_create_line_user

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/auth", tags=["Authentication"])

LINE_AUTH_URL = "https://access.line.me/oauth2/v2.1/authorize"
LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token"
LINE_PROFILE_URL = "https://api.line.me/v2/profile"


@router.get("/login")
async def line_login():
    """Redirect user to LINE Login authorization page."""
    params = {
        "response_type": "code",
        "client_id": settings.LINE_LOGIN_CHANNEL_ID,
        "redirect_uri": settings.LINE_LOGIN_REDIRECT_URI,
        "state": "famicare_login",
        "scope": "profile openid",
    }
    # Manually build query string to ensure %20 for spaces in scope
    query = urlencode(params).replace("+", "%20")
    auth_url = f"{LINE_AUTH_URL}?{query}"
    logger.info(f"Redirecting to LINE with URL: {auth_url}")
    return RedirectResponse(url=auth_url)


@router.get("/callback")
async def line_callback(
    code: str | None = None, 
    error: str | None = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Handle LINE Login OAuth callback.
    """
    if error:
        logger.error(f"LINE Login Error: {error}")
        raise HTTPException(status_code=400, detail=f"LINE login failed: {error}")

    if not code:
        raise HTTPException(status_code=400, detail="Missing authorization code")

    # 1. Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_data = {
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.LINE_LOGIN_REDIRECT_URI,
            "client_id": settings.LINE_LOGIN_CHANNEL_ID,
            "client_secret": settings.LINE_LOGIN_CHANNEL_SECRET,
        }
        token_resp = await client.post(LINE_TOKEN_URL, data=token_data)
        
        if token_resp.status_code != 200:
            logger.error(f"Token exchange failed: {token_resp.text}")
            raise HTTPException(status_code=401, detail="Failed to exchange token with LINE")
        
        tokens = token_resp.json()
        access_token = tokens.get("access_token")

        # 2. Fetch user profile
        profile_resp = await client.get(
            LINE_PROFILE_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if profile_resp.status_code != 200:
            logger.error(f"Profile fetch failed: {profile_resp.text}")
            raise HTTPException(status_code=401, detail="Failed to fetch profile from LINE")
        
        profile = profile_resp.json()
        line_user_id = profile.get("userId")
        display_name = profile.get("displayName")
        picture_url = profile.get("pictureUrl")

    # 3. Create or update user in database
    user = await get_or_create_line_user(
        db=db,
        line_user_id=line_user_id,
        display_name=display_name,
        picture_url=picture_url
    )

    # 4. Generate our system's JWT token
    system_token = create_access_token(data={
        "sub": str(user.id),
        "line_id": line_user_id,
        "name": display_name
    })

    # 5. Redirect back to frontend with token
    # In production, you might want to use a Secure HttpOnly cookie instead of URL param
    redirect_url = f"{settings.FRONTEND_URL}/login/success?token={system_token}"
    logger.info(f"User {display_name} authenticated successfully. Redirecting...")
    
    return RedirectResponse(url=redirect_url)
@router.get("/profile")
async def get_profile(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Get the current logged in user's profile.
    """
    from app.models.user_model import User
    import uuid
    user_id = uuid.UUID(current_user.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id, User.deleted_at == None))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    return {
        "id": user.id,
        "display_name": user.display_name,
        "picture_url": user.picture_url,
        "role": user.role,
        "primary_patient_id": user.primary_patient_id
    }


class PrimaryPatientUpdate(BaseModel):
    patient_id: str

@router.put("/profile/primary")
async def update_primary_patient(
    update_data: PrimaryPatientUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Set the primary patient ID for the logged-in user.
    """
    from app.models.user_model import User
    import uuid
    user_id = uuid.UUID(current_user.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id, User.deleted_at == None))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    user.primary_patient_id = update_data.patient_id
    await db.commit()
    
    return {"message": "Primary patient updated successfully", "primary_patient_id": user.primary_patient_id}


@router.delete("/profile")
async def delete_user_profile(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Soft delete the current user's profile.
    """
    from app.models.user_model import User
    from datetime import datetime
    import uuid
    user_id = uuid.UUID(current_user.get("sub"))
    result = await db.execute(select(User).where(User.id == user_id, User.deleted_at == None))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found or already deleted")
    
    user.deleted_at = datetime.now()
    await db.commit()
    
    return {"message": "User profile deleted successfully"}
