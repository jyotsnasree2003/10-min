# Warehouse Service

The **Warehouse Service** serves as the master database and source of truth for all warehouses (dark stores). It manages details such as storage capacity, operational hours, staff contact, geofence boundary configurations, and manager assignments.

When a warehouse is created, updated, or deactivated in this service, it invokes a synchronization webhook on the Location Service to keep spatial mapping caches in sync.

## Features

- **Master Records**: Acts as the system source-of-truth for warehouse operational metadata (capacity, staff, hours, assigned manager).
- **Location Sync Pipeline**: Fires webhook notifications (`notify.py`) to the Location Service (`POST /internal/warehouse-created`) to ensure spatial index maps are synchronized immediately.
- **Admin Verification Gateways**: Enforces Admin credentials to perform alterations, and cross-checks the user database via HTTP to verify that assigned managers exist and possess valid manager roles.

## Directory Structure

```text
warehouse_service/
├── app/
│   ├── routers/
│   │   └── warehouses.py     # Warehouse CRUD and lifecycle routes
│   ├── auth.py               # Token decoding & validation dependencies
│   ├── database.py           # DB engine, session provider, and base
│   ├── main.py               # FastAPI configuration, middlewares, and routers
│   ├── models.py             # Warehouse database models (SQLAlchemy)
│   ├── notify.py             # Location Service sync webhook dispatch client
│   ├── schemas.py            # Pydantic schema schemas (Create/Response)
│   └── service.py            # External service validators (manager role checking)
├── Dockerfile                # Container definition
├── requirements.txt          # Python dependencies
└── README.md                 # This documentation file
```

## Running the Service

### Using Docker (Compose)
From the root `E-com` folder:
```bash
docker-compose up -d warehouse-db warehouse-service
```

### Local Setup (Manual)
1. **Prepare Virtual Environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Database Setup**:
   Ensure PostgreSQL is running with a database named `warehouse_db`.

3. **Configure Environment Variables**:
   Create a `.env` file in this directory based on the template:
   ```env
   DATABASE_URL=postgresql://postgres:123456@localhost:5435/warehouse_db
   SECRET_KEY=your_jwt_secret_key
   ALGORITHM=HS256
   LOCATION_SERVICE_URL=http://localhost:8003
   AUTH_SERVICE_URL=http://localhost:8000
   ```

4. **Start Application**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8004 --reload
   ```

---

## API Endpoints

### Warehouse Endpoints (`/api/v1/warehouses`)

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Creates a dark store and triggers Location Service synchronization. | Admin |
| `GET` | `/` | Lists all warehouses in the system. | Admin |
| `GET` | `/{warehouse_id}` | Retrieves detailed metadata of a warehouse by ID. | Admin |
| `POST` | `/{warehouse_id}/deactivate` | Deactivates a warehouse and synces state with the Location Service. | Admin |
| `GET` | `/manager/{manager_id}` | Retrieves warehouse records assigned to a specific manager ID. | Admin |
