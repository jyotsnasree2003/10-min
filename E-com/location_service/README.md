# Location Service

Resolves a user's lat/lng into the warehouse (dark store) that serves them,
by checking which warehouse's geofence polygon contains that point.


```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt



uvicorn app.main:app --reload --port 8003
```

## Example: create a warehouse with a geofence

The `geofence` field is a list of `[lat, lng]` points tracing the boundary
of the area this warehouse serves (minimum 3 points; the polygon is
auto-closed).

```bash
curl -X POST http://localhost:8003/warehouses/ \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Gachibowli Dark Store",
    "lat": 17.4442,
    "lng": 78.3489,
    "geofence": [
      [17.4300, 78.3350],
      [17.4300, 78.3650],
      [17.4600, 78.3650],
      [17.4600, 78.3350]
    ]
  }'
```

## Example: resolve a user's location

```bash
curl -X POST http://localhost:8003/location/resolve \
  -H "Content-Type: application/json" \
  -d '{"lat": 17.4442, "lng": 78.3489}'
```

Point inside the polygon above → response:
```json
{"serviceable": true, "warehouse_id": "...", "warehouse_name": "Gachibowli Dark Store"}
```

Point outside every warehouse's polygon → response:
```json
{"serviceable": false, "warehouse_id": null, "warehouse_name": null}
```

## How other services use this

Every other microservice (catalog, inventory, order) should call
`POST /location/resolve` once when the user opens the app or changes
their address, cache the returned `warehouse_id` for that session, and
pass it along on every subsequent inventory/catalog/order call. This is
what makes stock and pricing "location aware" without duplicating the
product catalog per city.

## Roadmap for this service

- [ ] Swap `geofence` JSON column for a PostGIS `Geometry(POLYGON)` column
      and do the containment check in SQL (`ST_Contains`) instead of
      Python/Shapely — much faster once you have hundreds of warehouses.
- [ ] Add Alembic migrations instead of `create_all`.
- [ ] Cache `/location/resolve` results in Redis, keyed by rounded
      lat/lng, since geofence checks don't need to run on every request.
- [ ] Add an admin-only auth dependency on the `/warehouses` write
      endpoints once the Auth service exists.
- [ ] Add a pincode fallback table for areas where you don't have a
      precise polygon yet.
