# Product Service

The **Product Service** provides catalog management for the e-commerce system. It owns the schemas and database records representing products, brand categories, taxonomy groups (brands/categories), and media attachments (product pictures).

## Features

- **Product Catalog Management**: Supports creation, lookup, modification, and deletion of products.
- **Taxonomy Categories**: Links products dynamically to parent `Brand` and `Category` nodes.
- **File Uploads**: Handles binary file uploads for product images (stored locally in the `/uploads` directory).
- **Alembic Database Migrations**: Out-of-the-box configuration using Alembic to upgrade/downgrade PostgreSQL schemas seamlessly.
- **CORS Configuration**: Open CORS middleware configured for microservice and public gateway calls.

## Directory Structure

```text
product_services/
├── alembic/
│   ├── versions/           # Migration history scripts
│   ├── env.py              # Alembic environment config hook
│   └── script.py.mako      # Template script file for auto-migrations
├── core/
│   ├── authentication.py   # JWT decoding authorization dependencies
│   ├── brand.py            # Brand business logic wrappers
│   ├── category.py         # Category business logic wrappers
│   ├── product_image.py    # Media attachment logic wrappers
│   └── products.py         # Core product CRUD business logic
├── database/
│   ├── database.py         # DB engine setup and Base mapping model
│   └── dependencies.py     # Database session providers
├── models/
│   ├── brand.py            # Brand DB model definition
│   ├── category.py         # Category DB model definition
│   ├── product_image.py    # ProductImage DB model definition
│   └── products.py         # Product DB model definition
├── routers/
│   ├── brand.py            # Brand API routes (/api/v1/brands)
│   ├── category.py         # Category API routes (/api/v1/categories)
│   ├── product_image.py    # Image upload and media routes (/api/v1/product_image)
│   └── products.py         # Product CRUD API routes (/api/v1/products)
├── schemas/
│   ├── brand.py            # Brand Pydantic validation schemas
│   ├── category.py         # Category Pydantic validation schemas
│   ├── product_image.py    # Image metadata Pydantic schemas
│   └── products.py         # Product Pydantic schemas (Create/Update/Responses)
├── uploads/                # Directory storing physical product image assets
├── alembic.ini             # Database migration configurations
├── Dockerfile              # Container definition
├── main.py                 # FastAPI application root initializer
└── requirements.txt        # Python dependencies
```

## Running the Service

### Using Docker (Compose)
From the root `E-com` folder:
```bash
docker-compose up -d product-db product-service
```

### Local Setup (Manual)
1. **Prepare Virtual Environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Database Setup & Migrations**:
   Ensure PostgreSQL is running with a database named `product_db`.
   Run migrations:
   ```bash
   alembic upgrade head
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in this directory:
   ```env
   DATABASE_URL=postgresql://postgres:123456@localhost:5433/product_db
   SECRET_KEY=your_jwt_secret_key
   ALGORITHM=HS256
   ```

4. **Start Application**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8002 --reload
   ```

---

## API Endpoints

### Product Endpoints (`/api/v1/products`)

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Creates a new product. | Admin |
| `GET` | `/` | Lists all products in the catalog. | None |
| `GET` | `/{product_id}` | Retrieves a single product by ID. | None |
| `GET` | `/category/{category_id}` | Lists products matching a category ID. | None |
| `GET` | `/brand/{brand_id}` | Lists products matching a brand ID. | None |
| `PUT` | `/{product_id}` | Modifies a product. | Admin |
| `DELETE` | `/{product_id}` | Deletes a product. | Admin |

### Taxonomy Endpoints (`/api/v1/brands`, `/api/v1/categories`)

- `POST /brands` - Create a new Brand (Admin only)
- `GET /brands` - View all Brands
- `POST /categories` - Create a new Category (Admin only)
- `GET /categories` - View all Categories

### Image Endpoints (`/api/v1/product-images`)
- `POST /upload` - Upload a product image (multipart/form-data)
- `GET /{image_id}` - View image metadata
