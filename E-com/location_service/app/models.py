
from sqlalchemy import Boolean, Column, Float, JSON, String
from app.database import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID
class Warehouse(Base):
    """
    This is Location service's OWN copy of warehouse data - just enough
    to answer "which warehouse serves this point". It is kept in sync
    by the Warehouse service, which calls POST /internal/warehouse-created
    every time a warehouse is created or updated.

    Location service never creates warehouses itself anymore - that job
    belongs to the Warehouse service.
    """

    __tablename__ = "warehouses"
    id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    name = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    geofence = Column(JSON, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)