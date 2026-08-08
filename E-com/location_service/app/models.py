from sqlalchemy import Boolean, Column, Float, JSON, String
from app.database import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID


class Warehouse(Base):
    """
    Location service's own lightweight copy of warehouse data.
    Kept in sync by the Warehouse service via POST /internal/warehouse-created.

    geohash_cells: pre-computed list of geohash strings (precision 6)
    that cover this warehouse's geofence. Used to quickly filter
    candidate warehouses before running the expensive Shapely
    point_in_polygon check.
    """

    __tablename__ = "warehouses"

    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    name          = Column(String,  nullable=False)
    lat           = Column(Float,   nullable=False)
    lng           = Column(Float,   nullable=False)
    geofence      = Column(JSON,    nullable=False)
    is_active     = Column(Boolean, default=True, nullable=False)

    # NEW: pre-computed geohash cells for fast spatial filtering
    geohash_cells = Column(JSON,    nullable=True, default=list)
