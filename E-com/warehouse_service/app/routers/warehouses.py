from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from app import models, schemas
from app.auth import get_current_admin
from app.database import get_db
from app.notify import notify_location_service
from app.service import verify_manager

router = APIRouter(
    prefix="/warehouses",
    tags=["warehouses"]
)


@router.post("/", response_model=schemas.WarehouseOut, status_code=201)
async def create_warehouse(
    payload: schemas.WarehouseCreate,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    # Verify that the manager exists and has the inventory manager role
    await verify_manager(
        str(payload.manager_id),
        current_admin["token"]
    )

    warehouse = models.Warehouse(
        name=payload.name,
        lat=payload.lat,
        lng=payload.lng,
        geofence=[list(p) for p in payload.geofence],
        capacity=payload.capacity,
        opening_time=payload.opening_time,
        closing_time=payload.closing_time,
        contact_email=payload.contact_email,
        manager_id=payload.manager_id,
    )

    db.add(warehouse)
    db.commit()
    db.refresh(warehouse)

    notify_location_service(warehouse)

    return warehouse


@router.get("/", response_model=list[schemas.WarehouseOut])
def list_warehouses(
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    return db.query(models.Warehouse).all()


@router.get("/{warehouse_id}", response_model=schemas.WarehouseOut)
def get_warehouse(
    warehouse_id: str,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    warehouse = db.query(models.Warehouse).filter(
        models.Warehouse.id == warehouse_id
    ).first()

    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    return warehouse


@router.post("/{warehouse_id}/deactivate", response_model=schemas.WarehouseOut)
def deactivate_warehouse(
    warehouse_id: str,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    warehouse = db.query(models.Warehouse).filter(
        models.Warehouse.id == warehouse_id
    ).first()

    if not warehouse:
        raise HTTPException(status_code=404, detail="Warehouse not found")

    warehouse.is_active = False

    db.commit()
    db.refresh(warehouse)

    notify_location_service(warehouse)

    return warehouse



@router.get("/manager/{manager_id}", response_model=schemas.WarehouseOut)
def get_warehouse_by_manager(
    manager_id: UUID,
    db: Session = Depends(get_db),
    current_admin: dict = Depends(get_current_admin),
):
    warehouse = (
        db.query(models.Warehouse)
        .filter(models.Warehouse.manager_id == manager_id)
        .first()
    )

    if not warehouse:
        raise HTTPException(
            status_code=404,
            detail="Warehouse not found"
        )

    return warehouse