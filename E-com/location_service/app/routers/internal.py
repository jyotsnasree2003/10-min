from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.geohash_utils import compute_warehouse_geohashes

router = APIRouter(
    prefix="/internal",
    tags=["internal (called by other services)"]
)


@router.post(
    "/warehouse-created",
    response_model=schemas.WarehouseOut,
    status_code=201
)
def warehouse_created(
    payload: schemas.WarehouseCreate,
    db: Session = Depends(get_db)
):
    """
    Called by the Warehouse service right after it creates OR updates a
    warehouse. Location service saves/updates its own lightweight copy
    here so /location/resolve never has to call another service while
    a user is waiting.

    Geohash cells are computed here once and stored alongside the
    geofence, so resolve-time lookups are just a set-intersection
    instead of a full polygon scan.
    """
    geofence_list = [list(p) for p in payload.geofence]

    # Pre-compute geohash cells that cover this warehouse's geofence
    geohash_cells = compute_warehouse_geohashes(
        payload.lat,
        payload.lng,
        geofence_list
    )

    existing = (
        db.query(models.Warehouse)
        .filter(models.Warehouse.id == payload.id)
        .first()
    )

    if existing:
        existing.name          = payload.name
        existing.lat           = payload.lat
        existing.lng           = payload.lng
        existing.geofence      = geofence_list
        existing.is_active     = payload.is_active
        existing.geohash_cells = geohash_cells
        db.commit()
        db.refresh(existing)
        return existing

    warehouse = models.Warehouse(
        id            = payload.id,
        name          = payload.name,
        lat           = payload.lat,
        lng           = payload.lng,
        geofence      = geofence_list,
        is_active     = payload.is_active,
        geohash_cells = geohash_cells,
    )
    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)
    return warehouse
