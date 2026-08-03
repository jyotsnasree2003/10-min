from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from services import get_product,get_warehouse,get_warehouse_by_manager,verify_inventory_manager
from database.connection import get_db
from models.inventorymodel import Inventory
from core.authentication import get_inventory_manager
from schemas.inventoryschema import (
    InventoryCreate,
    InventoryUpdate,
    InventoryResponse,
    DecrementRequest,
    DecrementItem,
    ReserveStockRequest,
    ReleaseStockRequest,
    
)
from sqlalchemy import func
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
bearer_scheme = HTTPBearer()

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
)
import httpx
from core.authentication import get_admin_user

PRODUCT_SERVICE_URL = "http://product-service:8002"
WAREHOUSE_SERVICE_URL = "http://warehouse-service:8004"


from services import (
    get_product,
    get_warehouse,
    verify_inventory_manager,
)
from core.authentication import get_admin_user

@router.post("", response_model=InventoryResponse)
async def create_inventory(
    inventory: InventoryCreate,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user())
):

    token = admin["token"]

    # ---------------------------------------------------
    # Verify Product
    # ---------------------------------------------------
    product = await get_product(
        str(inventory.product_id),
        token
    )

    # ---------------------------------------------------
    # Verify Warehouse
    # ---------------------------------------------------
    warehouse = await get_warehouse(
        str(inventory.warehouse_id),
        token
    )
    print(warehouse)

    # ---------------------------------------------------
    # Warehouse Active?
    # ---------------------------------------------------
    if not warehouse["is_active"]:
        raise HTTPException(
            status_code=400,
            detail="Warehouse is inactive"
        )

    # ---------------------------------------------------
    # Warehouse Manager Assigned?
    # ---------------------------------------------------
    manager_id = warehouse.get("manager_id")
    print(manager_id)

    if manager_id is None:
        raise HTTPException(
            status_code=400,
            detail="Warehouse has no Inventory Manager assigned"
        )

    # ---------------------------------------------------
    # Verify Inventory Manager
    # ---------------------------------------------------
    await verify_inventory_manager(
        manager_id,
        token
    )

    # ---------------------------------------------------
    # Duplicate Inventory
    # ---------------------------------------------------
    existing = (
        db.query(Inventory)
        .filter(
            Inventory.product_id == str(inventory.product_id),
            Inventory.warehouse_id == str(inventory.warehouse_id)
        )
        .first()
    )

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Inventory already exists for this product in this warehouse"
        )

    # ---------------------------------------------------
    # Capacity Check
    # ---------------------------------------------------
    current_quantity = (
        db.query(
            func.coalesce(func.sum(Inventory.quantity), 0)
        )
        .filter(
            Inventory.warehouse_id == str(inventory.warehouse_id)
        )
        .scalar()
    )

    capacity = warehouse["capacity"]

    if capacity is not None:

        if current_quantity + inventory.quantity > capacity:

            raise HTTPException(
                status_code=400,
                detail=f"Warehouse capacity exceeded. Remaining capacity = {capacity-current_quantity}"
            )

    # ---------------------------------------------------
    # Calculate Quantities
    # ---------------------------------------------------
    reserved_quantity = 0

    available_quantity = inventory.quantity

    # ---------------------------------------------------
    # Save
    # ---------------------------------------------------
    new_inventory = Inventory(
        product_id=str(inventory.product_id),
        warehouse_id=str(inventory.warehouse_id),
        quantity=inventory.quantity,
        reserved_quantity=reserved_quantity,
        available_quantity=available_quantity,
    )

    db.add(new_inventory)

    db.commit()

    db.refresh(new_inventory)

    return new_inventory


@router.get("/", response_model=list[InventoryResponse])
def get_all_inventory(db: Session = Depends(get_db)):
    return db.query(Inventory).all()


@router.get("/warehouse/{warehouse_id}")
async def get_products_by_warehouse(
    warehouse_id: str,
    db: Session = Depends(get_db),
):
    # Get all inventory for the warehouse
    inventory = (
        db.query(Inventory)
        .filter(Inventory.warehouse_id == warehouse_id)
        .all()
    )
    print(inventory)

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="No products found for this warehouse."
        )

    products = []

    try:
        async with httpx.AsyncClient(timeout=10) as client:

            for item in inventory:

                response = await client.get(
                    f"{PRODUCT_SERVICE_URL}/api/v1/products/{item.product_id}"
                )

                # Product not found
                if response.status_code == 404:
                    continue

                # Any other error from Product Service
                if response.status_code != 200:
                    raise HTTPException(
                        status_code=502,
                        detail=f"Product Service returned {response.status_code}"
                    )

                product = response.json()

                # Add inventory information
                product["quantity"] = item.quantity
                product["available_quantity"] = item.available_quantity
                product["reserved_quantity"] = item.reserved_quantity
                product["warehouse_id"] = item.warehouse_id

                products.append(product)

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Unable to connect to Product Service."
        )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Product Service request timed out."
        )

    except httpx.HTTPError as e:
        raise HTTPException(
            status_code=500,
            detail=f"HTTP Error: {str(e)}"
        )

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Unexpected Error: {str(e)}"
        )

    if not products:
        raise HTTPException(
            status_code=404,
            detail="No valid products found for this warehouse."
        )

    return products

@router.get("/product/{product_id}", response_model=list[InventoryResponse])
def get_inventory_by_product(
    product_id: str,
    db: Session = Depends(get_db),
):
    inventory = (
        db.query(Inventory)
        .filter(Inventory.product_id == product_id)
        .all()
    )

    return inventory




@router.put("/{inventory_id}", response_model=InventoryResponse)
async def update_inventory(
    inventory_id: str,
    data: InventoryUpdate,
    db: Session = Depends(get_db),
    user=Depends(get_inventory_manager())
):

    token = user["token"]
    payload = user["payload"]

    inventory = (
        db.query(Inventory)
        .filter(Inventory.id == inventory_id)
        .first()
    )

    if not inventory:
        raise HTTPException(
            status_code=404,
            detail="Inventory not found"
        )

    warehouse = await get_warehouse(
        inventory.warehouse_id,
        token
    )

    # ----------------------------------------------------
    # Inventory Manager can update ONLY their warehouse
    # ----------------------------------------------------

    if payload["role"].lower() == "inventory manager":

        if warehouse["manager_id"] != payload["id"]:

            raise HTTPException(
                status_code=403,
                detail="You can only manage your own warehouse"
            )

    # ----------------------------------------------------
    # Capacity Validation
    # ----------------------------------------------------

    total_quantity = (
        db.query(
            func.coalesce(func.sum(Inventory.quantity), 0)
        )
        .filter(
            Inventory.warehouse_id == inventory.warehouse_id,
            Inventory.id != inventory.id
        )
        .scalar()
    )

    capacity = warehouse["capacity"]

    if capacity is not None:

        if total_quantity + data.quantity > capacity:

            raise HTTPException(
                status_code=400,
                detail="Warehouse capacity exceeded"
            )

    inventory.quantity = data.quantity

    inventory.reserved_quantity = data.reserved_quantity

    inventory.available_quantity = (
        data.quantity - data.reserved_quantity
    )

    db.commit()

    db.refresh(inventory)

    return inventory


@router.delete("/{inventory_id}")
def delete_inventory(
    inventory_id: str,
    db: Session = Depends(get_db),
    admin: dict = Depends(get_admin_user())
):
    inventory = (
        db.query(Inventory)
        .filter(Inventory.id == inventory_id)
        .first()
    )

    if not inventory:
        raise HTTPException(404, "Inventory not found")

    db.delete(inventory)
    db.commit()

    return {"message": "Inventory deleted successfully"}

@router.post("/decrement")
def decrement_inventory(
    request: DecrementRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user())
):

    for item in request.products:

        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.product_id == item.product_id,
                Inventory.warehouse_id == item.warehouse_id
            )
            .first()
        )

        if not inventory:
            raise HTTPException(
                status_code=404,
                detail=f"Inventory not found for product {item.product_id}"
            )

        if inventory.reserved_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Only {inventory.reserved_quantity} items are reserved"
            )

        inventory.quantity -= item.quantity

        inventory.reserved_quantity -= item.quantity

        inventory.available_quantity = (
            inventory.quantity -
            inventory.reserved_quantity
        )

    db.commit()

    return {
        "message": "Inventory updated successfully"
    }

@router.post("/reserve")
def reserve_stock(
    request: ReserveStockRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user())
):
    for item in request.products:

        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.product_id == str(item.product_id),
                Inventory.warehouse_id == str(item.warehouse_id)
            )
            .first()
        )

        if not inventory:
            raise HTTPException(
                status_code=404,
                detail=f"Inventory not found for product {item.product_id}"
            )

        if inventory.available_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Only {inventory.available_quantity} items available"
            )

        inventory.reserved_quantity += item.quantity
        inventory.available_quantity = (
            inventory.quantity - inventory.reserved_quantity
        )

    db.commit()

    return {
        "message": "Stock reserved successfully"
    }




@router.post("/release")
def release_stock(
    request: ReleaseStockRequest,
    db: Session = Depends(get_db),
    admin=Depends(get_admin_user())
):
    for item in request.products:

        inventory = (
            db.query(Inventory)
            .filter(
                Inventory.product_id == str(item.product_id),
                Inventory.warehouse_id == str(item.warehouse_id)
            )
            .first()
        )

        if not inventory:
            raise HTTPException(
                status_code=404,
                detail=f"Inventory not found for product {item.product_id}"
            )

        if inventory.reserved_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Only {inventory.reserved_quantity} items are reserved"
            )

        inventory.reserved_quantity -= item.quantity

        inventory.available_quantity = (
            inventory.quantity -
            inventory.reserved_quantity
        )

    db.commit()

    return {
        "message": "Reserved stock released successfully"
    }




@router.get("/my-stock", response_model=list[InventoryResponse])
async def my_stock(
    db: Session = Depends(get_db),
    user=Depends(get_inventory_manager())
):
    token = user["token"]
    payload = user["payload"]

    # Get warehouse assigned to this manager
    warehouse = await get_warehouse_by_manager(
        payload["id"],
        token
    )

    inventory = (
        db.query(Inventory)
        .filter(
            Inventory.warehouse_id == warehouse["id"]
        )
        .all()
    )

    return inventory