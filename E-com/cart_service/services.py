import asyncio
import httpx

PRODUCT_SERVICE = "http://localhost:8002/api/v1"
INVENTORY_SERVICE = "http://localhost:8005/api/v1"


async def get_product_and_inventory(product_id: str):
    async with httpx.AsyncClient(timeout=5.0) as client:

        product_task = client.get(
            f"{PRODUCT_SERVICE}/products/{product_id}"
        )

        inventory_task = client.get(
            f"{INVENTORY_SERVICE}/inventory/{product_id}"
        )

        product_response, inventory_response = await asyncio.gather(
            product_task,
            inventory_task
        )

        product_response.raise_for_status()
        inventory_response.raise_for_status()

        return (
            product_response.json(),
            inventory_response.json()
        )


async def get_inventory(product_id: str):
    async with httpx.AsyncClient(timeout=5.0) as client:
        response = await client.get(
            f"{INVENTORY_SERVICE}/inventory/{product_id}"
        )

        response.raise_for_status()

        return response.json()