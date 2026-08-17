# Location Service

The **Location Service** determines whether a customer's location (specified by latitude and longitude coordinates) is serviceable and maps it to the specific warehouse (dark store) that serves them. It uses geofencing check algorithms to resolve coordinates instantly.

## Features

- **Geofence Matching**: Runs a polygon boundary containment check using `shapely` to match user locations to dark store boundaries.
- **Two-Phase Resolution Optimization**:
  - **Phase 1 (Geohash Filter)**: Generates user geohash cells and intersects them with precalculated warehouse geohash boundaries to downfilter candidates rapidly.
  - **Phase 2 (Precise Containment)**: Runs precise polygon containment checks solely on the downfiltered candidates, avoiding heavy calculations on non-adjacent stores.
- **Auto-Sync Webhook**: Exposes an internal API endpoint triggered by the Warehouse Service to update local warehouses and precalculate geohash boundaries.

## Directory Structure

```text
location_service/
├── app/
│   ├── routers/
│   │   ├── home.py           # Landing and standard service status route
│   │   ├── internal.py       # Webhook sync endpoints for the Warehouse service
│   │   ├── location.py       # Latitude/Longitude resolution engine
│   │   └── warehouses.py     # Local warehouse metadata views
│   ├── clients.py            # HTTP client utilities
│   ├── database.py           # DB engine, session provider, and base
│   ├── geofence.py           # Polygon intersection logic (Shapely)
│   ├── geohash_utils.py      # Geohashing computation helpers (geohash2)
│   ├── main.py               # FastAPI config, middleware, and auto-migration script
│   ├── models.py             # SQLite/PostgreSQL warehouse model representation
│   └── schemas.py            # Pydantic payloads for requests/responses
├── Dockerfile                # Container definition
├── requirements.txt          # Python dependencies
└── README.md                 # This documentation file
```

## Running the Service

### Using Docker (Compose)
From the root `E-com` folder:
```bash
docker-compose up -d location-db location-service
```

### Local Setup (Manual)
1. **Prepare Virtual Environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Database Setup**:
   Ensure PostgreSQL is running with a database named `location_db`.

3. **Configure Environment Variables**:
   Create a `.env` file in this directory:
   ```env
   DATABASE_URL=postgresql://postgres:123456@localhost:5434/location_db
   ```

4. **Start Application**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8003 --reload
   ```

---

## API Endpoints

### Location Resolution Endpoints (`/api/v1/location`)

| Method | Endpoint | Description | Payload Schema |
| :--- | :--- | :--- | :--- |
| `POST` | `/resolve` | Resolves a `(lat, lng)` point into a servicing dark store. | `ResolveRequest` |

### Internal Synchronization Endpoints (`/api/v1/internal`)

| Method | Endpoint | Description | Payload Schema |
| :--- | :--- | :--- | :--- |
| `POST` | `/warehouse-created` | Webhook triggered by Warehouse Service to sync/create a local store. | `WarehouseCreate` |

### Warehouse View Endpoints (`/api/v1/warehouses`)

| Method | Endpoint | Description | Payload Schema |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Returns all synchronized warehouses. | None |
| `GET` | `/{warehouse_id}` | Retrieves a single synchronized warehouse. | None |
