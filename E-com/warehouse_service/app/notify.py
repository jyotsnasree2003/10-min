import os
import httpx

LOCATION_SERVICE_URL = os.getenv(
    "LOCATION_SERVICE_URL",
    "http://location-service:8003"
)

def notify_location_service(warehouse):
    payload = {
        "id": str(warehouse.id),
        "name": warehouse.name,
        "lat": warehouse.lat,
        "lng": warehouse.lng,
        "geofence": warehouse.geofence,
        "is_active": warehouse.is_active,
    }

    url = f"{LOCATION_SERVICE_URL}/api/v1/internal/warehouse-created"

    print("=" * 60)
    print("Calling:", url)
    print("Payload:", payload)

    try:
        response = httpx.post(url, json=payload, timeout=10)

        print("Status:", response.status_code)
        print("Body:", response.text)

        response.raise_for_status()

        print("Warehouse synced successfully!")

    except Exception as e:
        print("ERROR:", e)

    print("=" * 60)