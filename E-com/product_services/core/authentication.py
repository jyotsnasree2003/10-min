from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

bearer = HTTPBearer()


def decode_token(token: str):
    try:
        return jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer)
):
    payload = decode_token(credentials.credentials)

    return {
        "payload": payload,
        "token": credentials.credentials
    }


def get_admin_user():
    def verify(
        user=Depends(get_current_user)
    ):
        role = user["payload"].get("role")

        if role.lower() != "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )

        return user

    return verify