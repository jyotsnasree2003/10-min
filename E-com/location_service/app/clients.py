import os

import httpx

# location_service now only needs to know where inventory_service
# lives - product_service enrichment moved into inventory_service.
INVENTORY_SERVICE_URL = os.getenv("INVENTORY_SERVICE_URL", "http://inventory-service:8005")


def get_inventory_for_warehouse(warehouse_id: str) -> list[dict]:
    """
    Returns every product stocked at this warehouse, already enriched
    with name/price/image/in_stock by inventory_service. Returns an
    empty list (rather than raising) if inventory_service is
    unreachable - a location lookup should still succeed even if the
    product list can't be fetched.
    """
    try:
        response = httpx.get(
            # NOTE: fixed missing "/" between base URL and path (was
            # producing http://localhost:8005api/v1/... before)
            f"{INVENTORY_SERVICE_URL}/api/v1/inventory/warehouse/{warehouse_id}",
            timeout=3.0,
        )
        response.raise_for_status()
        return response.json()["products"]
    except httpx.HTTPError:
        return []