from pydantic import BaseModel, ConfigDict
from uuid import UUID


class InventoryCreate(BaseModel):
    product_id: UUID
    warehouse_id: UUID
    quantity: int


class InventoryUpdate(BaseModel):
    quantity: int
    reserved_quantity: int = 0


class InventoryResponse(BaseModel):
    id: UUID
    product_id: UUID
    warehouse_id: UUID
    quantity: int
    reserved_quantity: int
    available_quantity: int

    model_config = ConfigDict(from_attributes=True)


class DecrementItem(BaseModel):
    product_id: str
    warehouse_id: str
    quantity: int


class DecrementRequest(BaseModel):
    products: list[DecrementItem]


class ReserveStockItem(BaseModel):
    product_id: UUID
    warehouse_id: UUID
    quantity: int


class ReserveStockRequest(BaseModel):
    products: list[ReserveStockItem]


class ReleaseStockItem(BaseModel):
    product_id: UUID
    warehouse_id: UUID
    quantity: int


class ReleaseStockRequest(BaseModel):
    products: list[ReleaseStockItem]