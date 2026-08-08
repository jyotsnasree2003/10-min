import uuid
from sqlalchemy import Column, Numeric, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.database import Base


class Order(Base):
    __tablename__ = "orders"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    warehouse_id = Column(UUID(as_uuid=True), nullable=False)
    total_amount = Column(Numeric(10, 2), nullable=False)
    delivery_address = Column(Text, nullable=False)
    payment_method = Column(String(50), nullable=False)
    payment_status = Column(String(30), default="Pending", nullable=False)
    order_status = Column(String(30), default="Pending", nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )