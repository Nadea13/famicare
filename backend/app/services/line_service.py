"""
line_service.py
───────────────
Service layer for LINE Messaging API interactions.
Handles image downloading and message replies.
"""

import logging

import httpx

from app.dependencies import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ── LINE API base URL ────────────────────────────────────────
LINE_API_BASE = "https://api-data.line.me/v2/bot/message"
LINE_REPLY_URL = "https://api.line.me/v2/bot/message/reply"


async def download_line_image(message_id: str) -> bytes:
    """
    Download an image sent by a LINE user.

    In production, this calls the LINE Content API.
    For MVP testing without valid credentials, returns mock image bytes.

    Args:
        message_id: The LINE message ID containing the image.

    Returns:
        Image bytes.
    """
    # ── Mock mode (when no access token is configured) ───────
    if not settings.LINE_CHANNEL_ACCESS_TOKEN or settings.LINE_CHANNEL_ACCESS_TOKEN.startswith("your_"):
        logger.warning(
            "LINE_CHANNEL_ACCESS_TOKEN not configured. Returning mock image bytes."
        )
        # Return a minimal valid PNG (1x1 pixel transparent)
        return (
            b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01"
            b"\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15\xc4\x89"
            b"\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01"
            b"\r\n\xb4\x00\x00\x00\x00IEND\xaeB`\x82"
        )

    # ── Production mode ──────────────────────────────────────
    url = f"{LINE_API_BASE}/{message_id}/content"
    headers = {"Authorization": f"Bearer {settings.LINE_CHANNEL_ACCESS_TOKEN}"}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, timeout=30.0)
        response.raise_for_status()
        return response.content


async def send_line_reply(reply_token: str, message: str) -> None:
    """
    Send a text reply to a LINE user.

    Args:
        reply_token: The reply token from the webhook event.
        message: Text message to send back.
    """
    # ── Mock mode ────────────────────────────────────────────
    if not settings.LINE_CHANNEL_ACCESS_TOKEN or settings.LINE_CHANNEL_ACCESS_TOKEN.startswith("your_"):
        logger.warning(
            "LINE_CHANNEL_ACCESS_TOKEN not configured. "
            f"Mock reply: {message[:100]}..."
        )
        return

    # ── Production mode ──────────────────────────────────────
    headers = {
        "Authorization": f"Bearer {settings.LINE_CHANNEL_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }
    payload = {
        "replyToken": reply_token,
        "messages": [{"type": "text", "text": message}],
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(
            LINE_REPLY_URL, headers=headers, json=payload, timeout=10.0
        )
        response.raise_for_status()

    logger.info(f"Reply sent to LINE (token: {reply_token[:8]}...)")


async def get_line_profile(user_id: str) -> dict:
    """
    Fetch user profile (display name, picture) from LINE.

    Args:
        user_id: LINE user ID.

    Returns:
        Dict with displayName and pictureUrl.
    """
    # ── Mock mode ────────────────────────────────────────────
    if not settings.LINE_CHANNEL_ACCESS_TOKEN or settings.LINE_CHANNEL_ACCESS_TOKEN.startswith("your_"):
        return {
            "displayName": f"User_{user_id[:6]}",
            "pictureUrl": "https://via.placeholder.com/150"
        }

    # ── Production mode ──────────────────────────────────────
    url = f"https://api.line.me/v2/bot/profile/{user_id}"
    headers = {"Authorization": f"Bearer {settings.LINE_CHANNEL_ACCESS_TOKEN}"}

    async with httpx.AsyncClient() as client:
        response = await client.get(url, headers=headers, timeout=10.0)
        if response.status_code != 200:
            logger.error(f"Failed to fetch LINE profile for {user_id}: {response.text}")
            return {"displayName": "LINE User", "pictureUrl": None}
        return response.json()
