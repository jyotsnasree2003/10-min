from typing import List, Optional, Tuple

from pydantic import BaseModel, Field, field_validator
from uuid import UUID

class WarehouseCreate(BaseModel):
    """
    What an admin sends to create a warehouse. No `id` here on purpose -
    the server generates it (see models.py default). This is different
    from Location service's internal WarehouseCreate schema, which DOES
    require `id`, because Location service is receiving an ID that
    already exists, not generating a new one.
    """

    name: str
    lat: float
    lng: float
    geofence: List[Tuple[float, float]] = Field(
        ..., description="List of [lat, lng] points forming the polygon boundary"
    )
    capacity: Optional[int] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    contact_email: Optional[str] = None
    manager_id: Optional[UUID] = None

    @field_validator("geofence")
    @classmethod
    def must_have_at_least_3_points(cls, v):
        if len(v) < 3:
            raise ValueError("geofence needs at least 3 points to form a polygon")
        return v


class WarehouseOut(BaseModel):
    id: UUID
    name: str
    lat: float
    lng: float
    geofence: List[Tuple[float, float]]
    capacity: Optional[int] = None
    manager_id: Optional[UUID] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    contact_email: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True
