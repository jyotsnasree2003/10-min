from uuid import UUID
from decimal import Decimal
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from schemas.brand import BrandResponse
from schemas.category import CategoryResponse
from schemas.product_image import ProductImageResponse


class ProductBase(BaseModel):
    name: str
    description: str
    price: Decimal
    is_active: bool = True


class ProductCreate(ProductBase):
    brand_id: UUID
    category_id: UUID


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    brand_id: UUID | None = None
    category_id: UUID | None = None
    price: Decimal | None = None
    is_active: bool | None = None


class ProductResponse(ProductBase):
    id: UUID

    brand: BrandResponse
    category: CategoryResponse
    images: list[ProductImageResponse] = []

    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)