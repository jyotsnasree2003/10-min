import httpx
from fastapi import HTTPException

AUTH_SERVICE_URL = "http://auth-service:8000"

async def verify_manager(manager_id: str, token: str):
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{AUTH_SERVICE_URL}/api/v1/user/users/{manager_id}",
            headers={
                "Authorization": f"Bearer {token}"
            }
        )

    if response.status_code == 404:
        raise HTTPException(
            status_code=404,
            detail="Inventory manager not found"
        )

    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text
        )

    user = response.json()

    if user["role"] != "inventory manager":
        raise HTTPException(
            status_code=400,
            detail="User is not an inventory manager"
        )

    return user