from sqlalchemy import Column, String, UUID, Boolean,TIMESTAMP, func
from database.connection import Base
import uuid

class UserModel(Base):
    __tablename__ = 'user'
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(250), nullable=False)
    email = Column(String(250), nullable=False, unique=True)
    hashed_password = Column(String(300), nullable=False)
    role = Column(String(100), default='customer', nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(TIMESTAMP(True), server_default=func.now())