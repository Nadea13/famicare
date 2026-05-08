"""
auth_router.py — LINE Login OAuth placeholder routes.
Scaffolds the auth flow for linking LINE users to dashboard sessions.
"""
import logging
import httpx
from fastapi import APIRouter, HTTPException
from fastapi.responses import RedirectResponse
from app.dependencies import get_settings

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
    query = "&".join(f"{k}={v}" for k, v in params.items())
    return RedirectResponse(url=f"{LINE_AUTH_URL}?{query}")


@router.get("/callback")
async def line_callback(code: str, state: str = ""):
    """
    Handle LINE Login OAuth callback.
    Exchanges auth code for access token, fetches profile, and links user.
    """
    if not settings.LINE_LOGIN_CHANNEL_ID or settings.LINE_LOGIN_CHANNEL_ID.startswith("your_"):
        logger.warning("LINE Login not configured. Returning mock user.")
        return {
            "status": "mock_login",
            "user": {"line_user_id": "U_mock_user", "display_name": "Mock User"},
            "message": "Configure LINE_LOGIN_CHANNEL_ID to enable real auth.",
        }

    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(LINE_TOKEN_URL, data={
            "grant_type": "authorization_code",
            "code": code,
            "redirect_uri": settings.LINE_LOGIN_REDIRECT_URI,
            "client_id": settings.LINE_LOGIN_CHANNEL_ID,
            "client_secret": settings.LINE_LOGIN_CHANNEL_SECRET,
        })
        if token_resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to exchange token")
        tokens = token_resp.json()

        # Fetch user profile
        profile_resp = await client.get(
            LINE_PROFILE_URL,
            headers={"Authorization": f"Bearer {tokens['access_token']}"},
        )
        if profile_resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Failed to fetch profile")
        profile = profile_resp.json()

    # TODO: Create or update user in database using profile["userId"]
    # TODO: Create a session/JWT token and set cookie or return token
    logger.info(f"LINE Login success: {profile.get('displayName')}")
    return {
        "status": "authenticated",
        "user": {
            "line_user_id": profile.get("userId"),
            "display_name": profile.get("displayName"),
            "picture_url": profile.get("pictureUrl"),
        },
    }
