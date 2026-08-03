from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from datetime import datetime


class CartCreate(BaseModel):
    user_id:UUID
    product_id: UUID
    warehouse_id: UUID
    quantity: int
    price: Decimal


class CartUpdate(BaseModel):
    quantity: int


class CartResponse(BaseModel):
    id: UUID
    user_id: UUID
    product_id: UUID
    warehouse_id: UUID
    quantity: int
    price: Decimal
    created_at: datetime

    class Config:
        from_attributes = True