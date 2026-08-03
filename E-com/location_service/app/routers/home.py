from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app import schemas
from app.clients import get_inventory_for_warehouse
from app.database import get_db
from app.routers.location import find_serving_warehouse

router = APIRouter(tags=["home"])


@router.post("/home", response_model=schemas.HomeResponse)
def home(payload: schemas.ResolveRequest, db: Session = Depends(get_db)):
    """
    The single call the frontend uses instead of separate resolve /
    list-products / check-stock calls.

    inventory_service now does the product_service enrichment itself,
    so this endpoint only needs to call inventory_service once and can
    pass its response straight through as HomeProduct entries.

    If the point isn't serviceable, we return an empty product list
    rather than erroring - same fallback behavior as before.
    """
    warehouse = find_serving_warehouse(db, payload.lat, payload.lng)

    if not warehouse:
        return schemas.HomeResponse(serviceable=False, products=[])

    enriched_products = get_inventory_for_warehouse(warehouse.id)

    products = [
        schemas.HomeProduct(
            id=item["id"],
            name=item["name"],
            category=item.get("category"),
            base_price=item["base_price"],
            image_url=item.get("image_url"),
            quantity=item["quantity"],
            in_stock=item["in_stock"],
        )
        for item in enriched_products
    ]

    return schemas.HomeResponse(
        serviceable=True,
        warehouse_id=str(warehouse.id),
        warehouse_name=warehouse.name,
        products=products,
    )