# Cart Service

The **Cart Service** manages customer shopping carts. It allows users to add items to their cart, view cart contents, update item quantities, and clear their cart. It integrates with the Product Service and Inventory Service to validate item availability and pricing.

## Features

- **Manage Cart Items**: Add, retrieve, update, and remove items in the cart.
- **Bulk Action**: Clear the entire cart for a user.
- **External Integration**: Uses helper service functions to query product detail endpoints (Product Service) and stock counts (Inventory Service).
- **JWT Authorization**: Protects user-specific carts, extracting user identity from decoded JWT payloads.

## Directory Structure

```text
cart_service/
├── core/
│   └── authentication.py   # JWT decoding & token validation helper
├── database/
│   └── connection.py       # DB engine, session provider, and base
├── models/
│   └── cartmodel.py        # CartItem database schema (SQLAlchemy)
├── routers/
│   └── cartrouter.py       # Cart endpoints (/api/v1/cart)
├── schemas/
│   └── cartschema.py       # Pydantic validation schemas (Create/Update/Response)
├── Dockerfile              # Container definition
├── main.py                 # Application initialization and CORS setup
├── requirements.txt        # Python dependencies
└── services.py             # Integrations with Product & Inventory services
```

## Running the Service

### Using Docker (Compose)
From the root `E-com` folder:
```bash
docker-compose up -d cart-db cart-service
```

### Local Setup (Manual)
1. **Prepare Virtual Environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Database Setup**:
   Ensure PostgreSQL is running with a database named `cart_db`.

3. **Configure Environment Variables**:
   Create a `.env` file in this directory:
   ```env
   DATABASE_URL=postgresql://postgres:123456@localhost:5432/cart_db
   SECRET_KEY=your_jwt_secret_key
   ALGORITHM=HS256
   PRODUCT_SERVICE_URL=http://localhost:8002
   INVENTORY_SERVICE_URL=http://localhost:8005
   ```

4. **Start Application**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8006 --reload
   ```

---

## API Endpoints

### Cart Endpoints (`/api/v1/cart`)

All endpoints require a valid user JWT authorization header.

| Method | Endpoint | Description | Payload Schema |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Add an item to the shopping cart. | `CartCreate` |
| `GET` | `/` | Retrieve all items currently in the logged-in user's cart. | None |
| `GET` | `/{cart_id}` | Retrieve details of a specific cart item. | None |
| `PUT` | `/{cart_id}` | Update quantity of a specific cart item. | `CartUpdate` |
| `DELETE` | `/{cart_id}` | Remove a specific item from the cart. | None |
| `DELETE` | `/` | Clear all items from the logged-in user's cart. | None |
