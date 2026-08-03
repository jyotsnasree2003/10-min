from uuid import UUID
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ProductImageBase(BaseModel):
    image_url: str
    alt_text: str | None = None
    display_order: int = 1
    is_primary: bool = False


class ProductImageCreate(ProductImageBase):
    product_id: UUID


class ProductImageUpdate(BaseModel):
    image_url: str | None = None
    alt_text: str | None = None
    display_order: int | None = None
    is_primary: bool | None = None


class ProductImageResponse(ProductImageBase):
    id: UUID
    product_id: UUID
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)