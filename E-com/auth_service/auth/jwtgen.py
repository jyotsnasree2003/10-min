from jose import jwt
from datetime import datetime, timedelta, UTC
from dotenv import load_dotenv
import os
from database.dependencies import get_db
from fastapi import Depends
from database.connection import Session
from models.refreshmodel import RefreshModel

load_dotenv()

ACC_EXPIRE = os.getenv("ACC_EXPIRE")
REFRESH_EXPIRE = os.getenv("REFRESH_EXPIRE")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

def create_access_token(**data: dict):
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(minutes=int(ACC_EXPIRE))
    to_encode['exp'] = expire
    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

def create_refresh_token(db:Session, **data: dict):
    to_encode = data.copy()
    expire = datetime.now(UTC) + timedelta(days=int(REFRESH_EXPIRE))
    to_encode['exp'] = expire
    refresh_token = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )
    db.add(RefreshModel(
        user_id=to_encode['id'],
        refresh_token=refresh_token, 
        expires_at=expire, 
        create_at=datetime.now(UTC)))
    db.commit()
    return refresh_token

def delete_refresh_token(db:Session, id):
    db_data = db.query(RefreshModel).filter(RefreshModel.user_id==id).first()
    db.delete(db_data)
    db.commit()