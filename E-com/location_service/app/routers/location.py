from typing import Optional

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db
from app.geofence import point_in_polygon

router = APIRouter(prefix="/location", tags=["Location"])


def find_serving_warehouse(
    db: Session,
    lat: float,
    lng: float
) -> Optional[models.Warehouse]:

    warehouses = (
        db.query(models.Warehouse)
        .filter(models.Warehouse.is_active == True)
        .all()
    )

    print(f"User Location : ({lat}, {lng})")
    print(f"Total Warehouses : {len(warehouses)}")

    for warehouse in warehouses:

        print(f"\nChecking Warehouse : {warehouse.name}")
        print(f"Warehouse Center : ({warehouse.lat}, {warehouse.lng})")
        print(f"Geofence : {warehouse.geofence}")

        if not warehouse.geofence or len(warehouse.geofence) < 3:
            print("Invalid geofence")
            continue

        try:
            if point_in_polygon(lat, lng, warehouse.geofence):
                print(f"Matched Warehouse : {warehouse.name}")
                return warehouse

        except Exception as e:
            print(f"Geofence Error : {e}")

    print("No Warehouse Found")
    return None


@router.post("/resolve", response_model=schemas.ResolveResponse)
def resolve_location(
    payload: schemas.ResolveRequest,
    db: Session = Depends(get_db)
):

    warehouse = find_serving_warehouse(
        db,
        payload.lat,
        payload.lng
    )

    if warehouse:
        return schemas.ResolveResponse(
            serviceable=True,
            warehouse_id=str(warehouse.id),
            warehouse_name=warehouse.name,
        )

    return schemas.ResolveResponse(
        serviceable=False,
        warehouse_id=None,
        warehouse_name=None,
    )