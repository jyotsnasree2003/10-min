from sqlalchemy import Column, Integer, DECIMAL, DateTime
from sqlalchemy.sql import func
import uuid

from database.connection import Base
from sqlalchemy.dialects.postgresql import UUID


class CartModel(Base):
    __tablename__ = "cart"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID, nullable=False)
    product_id = Column(UUID, nullable=False)
    warehouse_id =Column(UUID,nullable=False)
    quantity = Column(Integer, nullable=False)
    price = Column(DECIMAL(8, 2), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())