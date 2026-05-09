import jwt
import datetime
import logging
from typing import Optional, Tuple
from app.dependencies import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

def create_invitation_token(patient_id: str, role: str) -> str:
    """
    Create a signed token for inviting a member.
    """
    payload = {
        "patient_id": patient_id,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=48)  # 2 days expiry
    }
    return jwt.encode(payload, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)

def verify_invitation_token(token: str) -> Optional[dict]:
    """
    Verify and decode the invitation token.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Invitation token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid invitation token: {e}")
        return None
