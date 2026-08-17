# QuickO - 10-Minute Grocery Delivery App

QuickO is a superfast, location-aware 10-minute grocery and essential quick commerce delivery platform. It consists of a modern frontend single-page web application and a collection of backend microservices running behind an Nginx API Gateway.

## Architecture Overview

The system is structured as a microservices architecture where each service has a dedicated role and database to guarantee high cohesion and low coupling.

For a detailed review of ports, API routes, and container layout, read the [Tech Stack Reference](TECH_STACK.md).

```text
├── E-com/
│   ├── auth_service/          # User authentication and admin RBAC console
│   ├── cart_service/          # Shopping cart management
│   ├── inventory_services/    # Product stock, reservation, and capacity checking
│   ├── location_service/      # Geofence location resolution & geohash pre-filtering
│   ├── notification_service/  # Registration verification (OTP via SMTP/Redis)
│   ├── order_service/         # Relational checkout and history management
│   ├── product_services/      # Catalog directories (Products, Categories, Brands)
│   ├── warehouse_service/     # Dark store master records and webhook dispatchers
│   ├── nginx/                 # API Gateway reverse proxy config
│   └── docker-compose.yml     # Local orchestration setup
├── css/                       # Modular frontend style modules
├── js/                        # Vanilla JS frontend application code
├── index.html                 # Main landing and SPA web app
└── TECH_STACK.md              # Detailed Tech Stack overview
```

## Running the Application

### 1. Run the Backend Microservices
All microservices, database clusters, and cache brokers are configured via Docker Compose in the `E-com` folder.

1. Install [Docker](https://www.docker.com/) on your local machine.
2. Navigate to the `E-com` directory and spin up the environment:
   ```bash
   cd E-com
   docker-compose up -d --build
   ```
3. Docker will launch:
   - **PostgreSQL Databases** mapped to dedicated ports for each microservice.
   - **Redis Cache** on port `6379`.
   - **Nginx API Gateway** on port `80`.
   - **All 8 Python FastAPI microservices** inside their respective containers.

### 2. Run the Frontend Client
The frontend is a vanilla SPA.
1. Simply double-click `index.html` to open it in a browser, or run a simple local web server:
   ```bash
   # Using Python
   python -m http.server 8080
   
   # Using Node (npx)
   npx http-server -p 8080
   ```
2. Navigate to `http://localhost:8080` in your web browser.

---

## Service List

Each microservice contains a dedicated detailed `README.md` detailing setup, environment variables, directory layouts, and endpoints:

- 👤 [Auth Service](E-com/auth_service/README.md)
- 🛒 [Cart Service](E-com/cart_service/README.md)
- 📦 [Inventory Service](E-com/inventory_services/README.md)
- 📍 [Location Service](E-com/location_service/README.md)
- ✉️ [Notification Service](E-com/notification_service/README.md)
- 🧾 [Order Service](E-com/order_service/README.md)
- 🏷️ [Product Service](E-com/product_services/README.md)
- 🏢 [Warehouse Service](E-com/warehouse_service/README.md)
