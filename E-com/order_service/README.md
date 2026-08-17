# Order Service

The **Order Service** manages the placement, status tracking, and history of customer orders. It coordinates items, calculates transaction amounts, and holds relational records linking customers, dark store warehouses, and ordered products.

## Features

- **Order Creation**: Computes subtotals and creates relational orders containing multiple line items.
- **Relational Tables**: Separates `Order` summaries (status, totals, addresses) from individual `OrderItem` records.
- **Status Workflows**: Allows status transitions (`Pending`, `Processing`, `Shipped`, `Delivered`, `Cancelled`) and payment tracking (`Pending`, `Paid`, `Failed`).
- **Authorization Contexts**:
  - Customers can create orders, view their own order history, and access their own specific orders.
  - Admins can query all system orders, modify statuses, or delete orders.

## Directory Structure

```text
order_service/
├── app/
│   ├── models/
│   │   ├── orderitemmodel.py # OrderItem database schema (SQLAlchemy)
│   │   └── ordermodel.py     # Order summary database schema (SQLAlchemy)
│   ├── routers/
│   │   └── orders.py         # Order endpoints (/api/v1/orders)
│   ├── auth.py               # Authentication helpers & role validator dependencies
│   ├── config.py             # System and environment variables loader
│   ├── database.py           # DB engine, session provider, and base
│   ├── main.py               # FastAPI application setup, middleware, and routers
│   ├── schemas.py            # Pydantic schemas (Create/Update/Responses)
│   └── Dockerfile            # Container definition
├── requirements.txt          # Python dependencies
└── README.md                 # This documentation file
```

## Running the Service

### Using Docker (Compose)
From the root `E-com` folder:
```bash
docker-compose up -d order-db order-service
```

### Local Setup (Manual)
1. **Prepare Virtual Environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Database Setup**:
   Ensure PostgreSQL is running with a database named `order_db`.

3. **Configure Environment Variables**:
   Create a `.env` file in this directory:
   ```env
   DATABASE_URL=postgresql://postgres:123456@localhost:5438/order_db
   SECRET_KEY=your_jwt_secret_key
   ALGORITHM=HS256
   ```

4. **Start Application**:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8007 --reload
   ```

---

## API Endpoints

### Order Endpoints (`/api/v1/orders`)

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Creates a new order and maps items. | Customer |
| `GET` | `/` | Lists all customer orders. | Admin |
| `GET` | `/my-orders` | Lists order history for the logged-in customer. | Authenticated User |
| `GET` | `/{order_id}` | Retrieves details for a specific order. | Owner / Admin |
| `PUT` | `/{order_id}/status` | Updates the status of an order (e.g. Shipped). | Admin |
| `PUT` | `/{order_id}/payment` | Updates payment status (e.g. Paid). | Admin |
| `DELETE` | `/{order_id}` | Removes an order from the database. | Admin |
