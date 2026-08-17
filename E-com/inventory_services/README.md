# Inventory Service

The **Inventory Service** manages product stock levels across all active warehouses (dark stores). It enforces capacity limits, supports stock reservations during the checkout pipeline, and handles stock release or deduction upon order completion or cancellation.

## Features

- **Inventory Tracking**: Records total quantity, reserved quantity, and available quantity for each product per warehouse.
- **Stock Reservations**: APIs to reserve stock during ordering (`/reserve`), release reservations if checkout fails (`/release`), or permanently deduct stock upon order fulfillment (`/decrement`).
- **Warehouse Capacity Check**: Validates that newly added/updated inventory does not exceed the warehouse's physical storage limit.
- **Role-Based Access Control**:
  - Admins can create/delete inventory and call reserve/release hooks.
  - Inventory Managers can update and query stocks exclusively for their assigned warehouse.

## Directory Structure

```text
inventory_services/
├── core/
│   └── authentication.py   # JWT decoding & helper dependency extractors
├── database/
│   └── connection.py       # DB engine, session provider, and metadata base
├── models/
│   └── inventorymodel.py   # Inventory database schema (SQLAlchemy)
├── routers/
│   └── inventoryrouter.py  # Inventory routes (/api/v1/inventory)
├── schemas/
│   └── inventoryschema.py  # Pydantic schemas (Create/Update/Requests/Response)
├── Dockerfile              # Container definition
├── main.py                 # FastAPI setup and CORS configuration
├── requirements.txt        # Python dependencies
└── services.py             # HTTP clients for Product & Warehouse validation
```

## Running the Service

### Using Docker (Compose)
From the root `E-com` folder:
```bash
docker-compose up -d inventory-db inventory-service
```

### Local Setup (Manual)
1. **Prepare Virtual Environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Database Setup**:
   Ensure PostgreSQL is running with a database named `inventory_db`.

3. **Configure Environment Variables**:
   Create a `.env` file in this directory:
   ```env
   DATABASE_URL=postgresql://postgres:123456@localhost:5436/inventory_db
   SECRET_KEY=your_jwt_secret_key
   ALGORITHM=HS256
   PRODUCT_SERVICE_URL=http://localhost:8002
   WAREHOUSE_SERVICE_URL=http://localhost:8004
   ```

4. **Start Application**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8005 --reload
   ```

---

## API Endpoints

### Inventory Endpoints (`/api/v1/inventory`)

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Creates a new inventory record for a product in a warehouse. | Admin |
| `GET` | `/` | Lists all inventory items. | None |
| `GET` | `/warehouse/{warehouse_id}` | Lists all products in a warehouse with full product metadata. | None |
| `GET` | `/product/{product_id}` | Retrieves inventory records for a product across all warehouses. | None |
| `PUT` | `/{inventory_id}` | Updates inventory quantities. | Inventory Manager / Admin |
| `DELETE` | `/{inventory_id}` | Deletes an inventory record. | Admin |
| `POST` | `/decrement` | Deducts stock from reserved pool permanently (upon order completion). | Admin |
| `POST` | `/reserve` | Reserves stock (moves from available to reserved pool). | Admin |
| `POST` | `/release` | Releases reserved stock back to available pool. | Admin |
| `GET` | `/my-stock` | Retrieves inventory for the logged-in manager's warehouse. | Inventory Manager |
