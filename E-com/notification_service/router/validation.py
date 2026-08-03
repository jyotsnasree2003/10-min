from fastapi import APIRouter, Response, status, HTTPException
from fastapi.responses import JSONResponse
from schema.otp import CreateUser
import secrets 
from database.redis_setup import redis_client
import json
from dotenv import load_dotenv
from fastapi_mail import ConnectionConfig
import os
from fastapi_mail import FastMail, MessageSchema

load_dotenv()

conf = ConnectionConfig(
    MAIL_USERNAME=os.getenv("EMAIL"),
    MAIL_PASSWORD=os.getenv("EMAIL_PASSWORD"),
    MAIL_FROM=os.getenv("EMAIL"),
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)

routers = APIRouter()
load_dotenv()
resend_api_key = os.getenv('RESEND_API_KEY')
# print(resend_api_key)
@routers.post('/generate-otp')
async def send_otp(user: CreateUser):
    otp = ''.join(str(secrets.randbelow(10)) for _ in range(6))
    try:
        message = MessageSchema(
        subject="OTP Verification",
        recipients=[user.email],
        body=f"""
            <h2>Your OTP is {otp}</h2>
            <p>This OTP is valid for 1 minutes.</p>
        """,
        subtype="html"
        )
        fm = FastMail(conf)
        await fm.send_message(message)

    except Exception as exe:
        raise HTTPException(
        status_code=500,
        detail="Failed to send OTP"
    )
    await redis_client.set(f"signup:{user.email}",
        json.dumps({
        "name": user.name,
        "email": user.email,
        "password": user.password,
        "otp": otp
    }),ex=60)
    return {'message':'stored in redis successfully'}