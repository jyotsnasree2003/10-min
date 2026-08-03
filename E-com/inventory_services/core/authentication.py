import os

from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

bearer_scheme = HTTPBearer()


def decode_access_token(token: str):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        return payload

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)
):
    payload = decode_access_token(credentials.credentials)

    # return both payload and raw JWT
    return {
        "payload": payload,
        "token": credentials.credentials
    }


# -------------------------
# Admin Only
# -------------------------
def get_admin_user():

    def verify(user=Depends(get_current_user)):

        if user["payload"]["role"].lower() != "admin":
            raise HTTPException(
                status_code=403,
                detail="Admin permission required"
            )

        return user

    return verify


# -------------------------
# Inventory Manager OR Admin
# -------------------------
def get_inventory_manager():

    def verify(user=Depends(get_current_user)):

        role = user["payload"]["role"].lower()

        if role not in ("admin", "inventory manager"):
            raise HTTPException(
                status_code=403,
                detail="Permission denied"
            )

        return user

    return verify