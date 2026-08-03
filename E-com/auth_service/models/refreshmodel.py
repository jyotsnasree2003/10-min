from sqlalchemy import Column, UUID, func, Text, TIMESTAMP
from database.connection import Base
import uuid

class RefreshModel(Base):
    __tablename__ = 'refreshtoken_table'
    id = Column(UUID(as_uuid=True), default=uuid.uuid4, primary_key=True)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    refresh_token = Column(Text, nullable=False)
    expires_at = Column(TIMESTAMP(True), nullable=False)
    create_at = Column(TIMESTAMP(True), server_default=func.now())