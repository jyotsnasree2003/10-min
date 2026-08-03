from pydantic import BaseModel, EmailStr, field_validator
from exception.password import PasswordValidationException

class CreateUser(BaseModel):
    name : str
    email : EmailStr
    password : str

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str):
        if len(value) < 8:
            raise PasswordValidationException("Password must be at least 8 characters long")

        if not any(c.isupper() for c in value):
            raise PasswordValidationException("Password must contain at least one uppercase letter")

        if not any(c.islower() for c in value):
            raise PasswordValidationException("Password must contain at least one lowercase letter")

        if not any(c.isdigit() for c in value):
            raise PasswordValidationException("Password must contain at least one digit")

        if not any(c in "!@#$%^&*()_+-=[]{}|;:',.<>?/" for c in value):
            raise PasswordValidationException("Password must contain at least one special character")

        return value

class LogInUser(BaseModel):
    username : str | EmailStr
    password : str

class RefreshTokenRequest(BaseModel):
    refresh_token : str

class GetOtp(BaseModel):
    email : EmailStr
    otp : int

class ChangePassword(BaseModel):
    old_password : str
    new_password : str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, value: str):
        if len(value) < 8:
            raise PasswordValidationException("Password must be at least 8 characters long")

        if not any(c.isupper() for c in value):
            raise PasswordValidationException("Password must contain at least one uppercase letter")

        if not any(c.islower() for c in value):
            raise PasswordValidationException("Password must contain at least one lowercase letter")

        if not any(c.isdigit() for c in value):
            raise PasswordValidationException("Password must contain at least one digit")

        if not any(c in "!@#$%^&*()_+-=[]{}|;:',.<>?/" for c in value):
            raise PasswordValidationException("Password must contain at least one special character")

        return value