import os

import httpx
from dotenv import load_dotenv
from fastapi import HTTPException

load_dotenv()

PRODUCT_SERVICE_URL = os.getenv(
    "PRODUCT_SERVICE_URL",
    "http://localhost:8002"
)

WAREHOUSE_SERVICE_URL = os.getenv(
    "WAREHOUSE_SERVICE_URL",
    "http://localhost:8004"
)

AUTH_SERVICE_URL = os.getenv(
    "AUTH_SERVICE_URL",
    "http://localhost:8000"
)


async def get_product(product_id: str, token: str):

    try:
        async with httpx.AsyncClient(timeout=10) as client:

            response = await client.get(
                f"{PRODUCT_SERVICE_URL}/api/v1/products/{product_id}",
                headers={
                    "Authorization": f"Bearer {token}"
                },
            )

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Product Service unavailable"
        )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Product Service timeout"
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail="Product not found"
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text
        )

    return response.json()


async def get_warehouse(warehouse_id: str, token: str):

    try:
        async with httpx.AsyncClient(timeout=10) as client:

            response = await client.get(
                # Correct endpoint
                f"{WAREHOUSE_SERVICE_URL}/api/v1/warehouses/{warehouse_id}",
                headers={
                    "Authorization": f"Bearer {token}"
                },
            )

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Warehouse Service unavailable"
        )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Warehouse Service timeout"
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail="Warehouse not found"
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text
        )

    return response.json()


async def verify_inventory_manager(manager_id: str, token: str):

    try:
        async with httpx.AsyncClient(timeout=10) as client:

            response = await client.get(
                f"{AUTH_SERVICE_URL}/api/v1/user/users/{manager_id}",
                headers={
                    "Authorization": f"Bearer {token}"
                },
            )

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Auth Service unavailable"
        )

    except httpx.TimeoutException:
        raise HTTPException(
            status_code=504,
            detail="Auth Service timeout"
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail="Inventory Manager not found"
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text
        )

    user = response.json()

    if user["role"].lower() != "inventory manager":
        raise HTTPException(
            status_code=400,
            detail="Assigned user is not an Inventory Manager"
        )

    return user




async def get_warehouse_by_manager(manager_id: str, token: str):

    async with httpx.AsyncClient(timeout=10) as client:

        response = await client.get(
            f"{WAREHOUSE_SERVICE_URL}/api/v1/warehouses/manager/{manager_id}",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail="Warehouse not found for this manager"
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text
        )

    return response.json()