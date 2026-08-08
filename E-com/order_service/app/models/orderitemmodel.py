import uuid
from sqlalchemy import Column, ForeignKey, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID

from app.database import Base


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    order_id = Column(
        UUID(as_uuid=True),
        ForeignKey("orders.id", ondelete="CASCADE"),
        nullable=False
    )

    product_id = Column(UUID(as_uuid=True), nullable=False)

    quantity = Column(Integer, nullable=False)

    price = Column(Numeric(10, 2), nullable=False)

    subtotal = Column(Numeric(10, 2), nullable=False)