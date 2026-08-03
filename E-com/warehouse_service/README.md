# Warehouse Service

Owns the real, full data about every dark store: geofence, capacity,
opening hours, staff count. This is the source of truth - Location
service only holds a lightweight synced copy, received via a webhook.

No Docker needed - SQLite by default, just like your location-service.

## Where to put this folder

Drop this `warehouse_service` folder alongside your other services:
```
e-comm/
├── auth_service/
├── category_service/
├── location-service/
├── product_service/
└── warehouse_service/   <- this one
```

## Run it

```bash
cd warehouse_service
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8002
```

**Important:** this service calls Location service at
`http://localhost:8004` by default (matching the port you're already
running Location service on). If you run Location service on a
different port, set `LOCATION_SERVICE_URL` accordingly in a `.env`
file (copy `.env.example` and edit it).

## Tested end to end before this was handed to you

1. Location service started with an empty warehouse list
2. Created a warehouse ONLY through this service (`POST /warehouses/`)
   - it appeared automatically in Location service's `/warehouses/`
     with the exact same `id` - no manual step needed
3. `/location/resolve` correctly matched a point inside its geofence
4. Deactivated the warehouse through this service
   (`POST /warehouses/{id}/deactivate`)
   - Location service's copy updated automatically
   - `/location/resolve` for the same point now correctly returned
     `serviceable: false`

## Endpoints

- `POST /warehouses/` - create a warehouse (also notifies Location service)
- `GET /warehouses/` - list all warehouses (full data, including
  capacity/staff/hours - fields Location service never sees)
- `GET /warehouses/{id}` - get one warehouse
- `POST /warehouses/{id}/deactivate` - deactivate (also notifies Location
  service) - done as POST, not PATCH, matching the no-PUT/PATCH approach
  used across this project

## Example request

```bash
curl -X POST http://localhost:8002/warehouses/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gachibowli Dark Store",
    "lat": 17.4442, "lng": 78.3489,
    "geofence": [[17.4300,78.3350],[17.4300,78.3650],[17.4600,78.3650],[17.4600,78.3350]],
    "capacity": 2000, "opening_time": "06:00", "closing_time": "23:00"
  }'
```

## Why the schema in this service looks slightly different from Location's

Location service's `WarehouseCreate`/`WarehouseSync` schema requires
`id` in the request body, because it's *receiving* an ID that already
exists. This service's `WarehouseCreate` schema does NOT include `id` -
the server generates one (see `models.py`), because this is where
warehouses are actually born. Same name, different job - don't confuse
the two when editing.

## Roadmap

- [ ] Add admin auth once auth_service is wired in
- [ ] If webhook delivery reliability becomes a real problem, upgrade
      to a message broker (RabbitMQ/Kafka) instead of the direct
      HTTP call in `notify.py`
