"""
auth_service.py
───────────────
Service for creating and validating JSON Web Tokens (JWT).
Used for securing the Web Dashboard access.
"""

from datetime import datetime, timedelta, timezone
import jwt
import logging

from app.dependencies import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """
    Create a JWT access token.
    
    Args:
        data: Payload to encode (e.g. {"sub": user_id}).
        expires_delta: Optional expiration override.
        
    Returns:
        Encoded JWT string.
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> dict | None:
    """
    Decode and verify a JWT token.
    
    Returns:
        The decoded payload if valid, else None.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError:
        logger.warning("Invalid token")
        return None
