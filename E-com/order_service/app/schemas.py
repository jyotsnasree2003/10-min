from pydantic import BaseModel
from uuid import UUID
from decimal import Decimal
from datetime import datetime
from typing import List, Optional


# -----------------------------
# Order Item Schemas
# -----------------------------

class OrderItemCreate(BaseModel):
    product_id: UUID
    quantity: int
    price: Decimal


class OrderItemResponse(BaseModel):
    id: UUID
    order_id: UUID
    product_id: UUID
    quantity: int
    price: Decimal
    subtotal: Decimal

    class Config:
        from_attributes = True


# -----------------------------
# Order Schemas
# -----------------------------

class OrderCreate(BaseModel):
    user_id: Optional[UUID] = None
    warehouse_id: UUID
    delivery_address: str
    payment_method: str
    items: List[OrderItemCreate]


class OrderStatusUpdate(BaseModel):
    order_status: str


class PaymentStatusUpdate(BaseModel):
    payment_status: str


class OrderResponse(BaseModel):
    id: UUID
    user_id: UUID
    warehouse_id: UUID
    total_amount: Decimal
    delivery_address: str
    payment_method: str
    payment_status: str
    order_status: str
    created_at: datetime
    updated_at: datetime
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True