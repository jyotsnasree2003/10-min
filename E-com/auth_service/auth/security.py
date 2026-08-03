from fastapi.security import OAuth2PasswordBearer
from fastapi import Depends, HTTPException
import os
from dotenv import load_dotenv
from jose import jwt, JWTError

load_dotenv()

oauth_schema = OAuth2PasswordBearer(tokenUrl='/login')
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")

def get_current_user(token:str=Depends(oauth_schema)):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            ALGORITHM
        )
        
        return payload
    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid Token"
        )

