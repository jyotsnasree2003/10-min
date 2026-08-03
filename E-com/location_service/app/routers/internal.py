from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/internal", tags=["internal (called by other services)"])


@router.post("/warehouse-created", response_model=schemas.WarehouseOut, status_code=201)
def warehouse_created(payload: schemas.WarehouseCreate, db: Session = Depends(get_db)):
    """
    Called by the Warehouse service right after it creates OR updates a
    warehouse. Location service saves/updates its own lightweight copy
    here, so /location/resolve never has to call another service while
    a user is waiting for an answer.

    This endpoint is not meant to be called by end users or the
    frontend - only by the Warehouse service itself.
    """
    existing = db.query(models.Warehouse).filter(models.Warehouse.id == payload.id).first()

    if existing:
        existing.name = payload.name
        existing.lat = payload.lat
        existing.lng = payload.lng
        existing.geofence = [list(p) for p in payload.geofence]
        existing.is_active = payload.is_active
        db.commit()
        db.refresh(existing)
        return existing

    warehouse = models.Warehouse(
        id=payload.id,
        name=payload.name,
        lat=payload.lat,
        lng=payload.lng,
        geofence=[list(p) for p in payload.geofence],
        is_active=payload.is_active,
    )
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse
