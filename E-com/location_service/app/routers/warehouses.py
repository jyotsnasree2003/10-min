from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/warehouses", tags=["warehouses (read-only synced copy)"])


@router.get("/", response_model=list[schemas.WarehouseOut])
def list_warehouses(db: Session = Depends(get_db)):
    """
    Read-only. This shows Location service's own synced copy of
    warehouses - useful for checking "did the webhook from Warehouse
    service actually arrive?" while debugging. The real source of
    truth for warehouse data lives in the Warehouse service.
    """
    return db.query(models.Warehouse).all()
