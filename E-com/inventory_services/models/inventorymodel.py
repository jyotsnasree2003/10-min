import uuid
from sqlalchemy import Column, String, Integer,UniqueConstraint
from database.connection import Base


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(
        String(36),
        primary_key=True,
        default=lambda: str(uuid.uuid4())
    )

    product_id = Column(String(36), nullable=False)
    warehouse_id = Column(String(36), nullable=False)
    quantity = Column(Integer, default=0)
    reserved_quantity = Column(Integer, default=0)
    available_quantity = Column(Integer, default=0)

    __table_args__ = (
        UniqueConstraint(
            "product_id",
            "warehouse_id",
            name="uq_product_warehouse"
        ),
    )