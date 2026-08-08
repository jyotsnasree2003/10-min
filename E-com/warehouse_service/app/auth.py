import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import jwt
from jose.exceptions import JWTError, ExpiredSignatureError

load_dotenv()

# ------------------------------------------------------------------
# JWT Configuration
# ------------------------------------------------------------------
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY") or os.getenv("SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM") or os.getenv("ALGORITHM") or "HS256"
JWT_AUDIENCE = os.getenv("JWT_AUDIENCE")
JWT_ISSUER = os.getenv("JWT_ISSUER")

ROLE_CLAIM = os.getenv("JWT_ROLE_CLAIM", "role")
ADMIN_ROLE_VALUE = os.getenv("JWT_ADMIN_ROLE_VALUE", "admin")

bearer_scheme = HTTPBearer(auto_error=False)


def _decode_token(token: str) -> dict:
    if not JWT_SECRET_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="JWT_SECRET_KEY is not configured",
        )

    decode_kwargs = {
        "algorithms": [JWT_ALGORITHM]
    }

    if JWT_AUDIENCE:
        decode_kwargs["audience"] = JWT_AUDIENCE

    if JWT_ISSUER:
        decode_kwargs["issuer"] = JWT_ISSUER

    try:
        payload = jwt.decode(
            token,
            JWT_SECRET_KEY,
            **decode_kwargs
        )
        return payload

    except ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )

    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {str(exc)}",
        )


def _has_admin_role(payload: dict) -> bool:
    role = payload.get(ROLE_CLAIM)

    if role is None:
        return False

    if isinstance(role, list):
        return ADMIN_ROLE_VALUE in role

    return role == ADMIN_ROLE_VALUE


def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
):
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing Bearer token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = _decode_token(credentials.credentials)

    if not _has_admin_role(payload):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin role required",
        )

    return {
        "payload": payload,
        "token": credentials.credentials,
    }