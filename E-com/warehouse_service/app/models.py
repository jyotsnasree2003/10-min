
from sqlalchemy import Boolean, Column, Float, Integer, JSON, String
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import uuid
from sqlalchemy.dialects.postgresql import UUID


class Warehouse(Base):
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

    capacity = Column(Integer)
    opening_time = Column(String)
    closing_time = Column(String)
    contact_email = Column(String)
    manager_id = Column(UUID(as_uuid=True),nullable=False)

    is_active = Column(Boolean, default=True, nullable=False)