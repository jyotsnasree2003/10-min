import os
from dotenv import load_dotenv

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt

load_dotenv()

from app.config import JWT_SECRET_KEY, JWT_ALGORITHM

SECRET_KEY = JWT_SECRET_KEY
ALGORITHM = JWT_ALGORITHM

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
            detail={"message": "Invalid or expired token"},
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
):
    return decode_access_token(credentials.credentials)


# ==========================================================
# ADMIN
# ==========================================================

def get_admin_user(
    allowed_roles: tuple = ("Admin", "admin"),
):
    def _verify_admin(user: dict = Depends(get_current_user)):
        if user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "You do not have permission to perform this action"},
            )
        return user

    return _verify_admin


# ==========================================================
# CUSTOMER
# ==========================================================

def get_customer_user(
    allowed_roles: tuple = ("Customer", "customer"),
):
    def _verify_customer(user: dict = Depends(get_current_user)):
        if user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "Only customers can perform this action"},
            )
        return user

    return _verify_customer


# ==========================================================
# INVENTORY MANAGER
# ==========================================================

def get_inventory_manager_user(
    allowed_roles: tuple = ("INVENTORY MANAGER", "inventory manager"),
):
    def _verify_manager(user: dict = Depends(get_current_user)):
        if user.get("role") not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail={"message": "Only inventory managers can perform this action"},
            )
        return user

    return _verify_manager


# ==========================================================
# AUTHENTICATED USER
# ==========================================================

def get_authenticated_user():
    def _verify_user(user: dict = Depends(get_current_user)):
        return user

    return _verify_user