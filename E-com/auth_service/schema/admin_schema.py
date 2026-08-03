from pydantic import BaseModel, EmailStr
from uuid import UUID

class GetUserResponse(BaseModel):
    id: UUID
    name: str 
    email: EmailStr
    role: str
    model_config = {
        "from_attributes": True
    }

class ModifyUser(BaseModel):
    name : str | None = None
    email : EmailStr | None = None
    role : str | None = None

    model_config={
        "from_attributes": True
    }