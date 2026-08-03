from typing import List, Optional, Tuple
from pydantic import BaseModel

from uuid import UUID
class WarehouseCreate(BaseModel):
    id: UUID
    name: str
    lat: float
    lng: float
    geofence: List[Tuple[float, float]]
    is_active: bool = True


class WarehouseOut(BaseModel):
    id: UUID
    name: str
    lat: float
    lng: float
    geofence: List[Tuple[float, float]]
    is_active: bool

    class Config:
        from_attributes = True


class ResolveRequest(BaseModel):
    lat: float
    lng: float


class ResolveResponse(BaseModel):
    serviceable: bool
    warehouse_id: Optional[UUID] = None
    warehouse_name: Optional[str] = None


class HomeProduct(BaseModel):
    id: str
    name: str
    category: Optional[str] = None
    base_price: float
    image_url: Optional[str] = None
    quantity: int
    in_stock: bool


class HomeResponse(BaseModel):
    serviceable: bool
    warehouse_id: Optional[str] = None
    warehouse_name: Optional[str] = None
    products: List[HomeProduct] = []