from passlib.context import CryptContext
import bcrypt

pwd_context = CryptContext(
    schemes=['bcrypt'],
    deprecated='auto'
)

def hash_password(password: str):
    return bcrypt.hashpw(password.encode("utf-8"),salt=bcrypt.gensalt()).decode("utf-8")

def verify_password(password: str, hashed_password: str):
    return bcrypt.checkpw(password.encode("utf-8"), hashed_password.encode("utf-8"))