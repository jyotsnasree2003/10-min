from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import JSONResponse
from schema.user_schema import CreateUser, LogInUser, RefreshTokenRequest, ChangePassword, GetOtp
from auth.security import get_current_user
from uuid import UUID   
from database.connection import Session
from database.dependencies import get_db
from models.usermodel import UserModel
from auth.password import hash_password, verify_password
from auth import jwtgen
from jose import jwt, JWTError
import os
from dotenv import load_dotenv
from auth.jwtgen import create_access_token, delete_refresh_token
from auth.security import get_current_user
from datetime import datetime, timedelta, UTC
from models.refreshmodel import RefreshModel
import httpx
from database.redisd_setup import redis_client
import json

load_dotenv()
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

router = APIRouter()

@router.post('/signup')
async def signup(user: GetOtp, db: Session=Depends(get_db)):
    data = await redis_client.get(f"signup:{user.email}")
    if data is None:
        raise HTTPException(
        status_code=400,
        detail="OTP expired"
        )
    userdata = json.loads(data)
    print(userdata)
    if user.otp == int(userdata['otp']):
        existing = db.query(UserModel).filter(
        UserModel.email == userdata["email"]
        ).first()
        if existing:
            raise HTTPException(
            status_code=409,
            detail="User already exists"
        )
        user = UserModel(name=userdata['name'], email=userdata['email'], hashed_password=hash_password(userdata['password']))
        db.add(user)
        db.commit()
        db.refresh(user)
        await redis_client.delete(f"signup:{user.email}")
        return {"message":"user created"}
    else:
        raise HTTPException(
        status_code=400,
        detail="Invalid OTP"
)

@router.post('/request-otp')
async def verify_otp(data : CreateUser, db: Session=Depends(get_db)):
    db_user = db.query(UserModel).filter((UserModel.email==data.email)).first()
    if db_user:
        print("its here")
        raise HTTPException(
        status_code=409,
        detail="Email already exists"
    )
    data = {
        'name' : data.name,
        'email' : data.email,
        'password' : data.password
    }
    print("notification-service")
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
         response = await client.post(
            "http://notification-service:8008/api/v1/generate-otp",
            json=data
        )

        print("Status:", response.status_code)
        print("Body:", response.text)

    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Exception:", repr(e))
        raise
    # return {'message':'otp sent successfull'}

@router.post('/login')
def login(user: LogInUser, db: Session=Depends(get_db)):
    db_user = db.query(UserModel).filter((UserModel.email==user.username) | (UserModel.name==user.username)).first()
    if db_user is not None:
        if verify_password(user.password, db_user.hashed_password):
            access_token = jwtgen.create_access_token(id=str(db_user.id), name=db_user.name, role=db_user.role, email=db_user.email)
            refresh_token=jwtgen.create_refresh_token(db, id=str(db_user.id), name=db_user.name, role=db_user.role, email=db_user.email)
            return {
                "access_token":access_token,
                "refresh_token":refresh_token
            }
        else:
            raise HTTPException(status_code=401, detail='password')
    else:
        raise HTTPException(status_code=401, detail='invalid username or emailid')
    
@router.post('/refresh')
def refresh_token(request: RefreshTokenRequest, db: Session=Depends(get_db)):
    try:
        payload = jwt.decode(
            request.refresh_token,
            SECRET_KEY,
            ALGORITHM
        )
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid Refresh Token"
        )
    dt = datetime.now(tz=UTC)
    if int(dt.timestamp()) > payload['exp']:
        delete_refresh_token(db, payload['id'])
        raise HTTPException(
            status_code=400,
            detail="refresh token expired"
        )
    req_token = create_access_token(
        id=payload['id'],
        name=payload['name'],
        role=payload['role'],
        email=payload['email']
    )
    return {"access_token":req_token}

@router.get('/profile')
def profile(payload: dict=Depends(get_current_user)):
    return payload

@router.get('/logout')
def logout(db: Session=Depends(get_db),payload: dict=Depends(get_current_user)):
    delete_refresh_token(db, payload['id'])
    return {'message':'logout successfull'}

@router.patch('/change_password')
def change_password(data: ChangePassword, user: dict=Depends(get_current_user), db: Session = Depends(get_db)):
    user_db = db.query(UserModel).filter(UserModel.email==user['email']).first()
    if not user_db:
        raise HTTPException(404, "User not found")
    if not verify_password(
        data.current_password,
        user_db.hashed_password
    ):
        raise HTTPException(
            400,
            "Current password is incorrect"
        )
    user_db.hashed_password = hash_password(
        data.new_password
    )
    db.commit()
    db.refresh(user_db)

    return {
        "message": "Password updated successfully"
    }
@router.get("/users/{user_id}")
def get_user(
    user_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id": str(user.id),
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }