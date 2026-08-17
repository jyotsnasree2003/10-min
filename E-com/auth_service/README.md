# Auth Service

The **Auth Service** handles user registration, authentication, authorization, token management, and profile operations. It serves as the security gateway for the entire system, providing JSON Web Token (JWT) generation and verification, including database-backed session-refresh mechanism.

## Features

- **OTP-Based Registration**: Signup verification via time-limited OTP tokens using Redis and SMTP/mail dispatch (communicating with the Notification Service).
- **JWT Authentication**: User login generates access and refresh tokens.
- **Role-Based Access Control (RBAC)**: Support for `Admin`, `customer`, and `inventory manager` roles.
- **Admin Management Portal**: CRUD capabilities over customer and manager accounts.
- **Security Protocols**: Hashed password storage using `bcrypt`/`passlib`.

## Directory Structure

```text
auth_service/
├── auth/
│   ├── jwtgen.py         # JWT and refresh token generator
│   ├── password.py       # Password hashing & verification
│   ├── role.py           # Dependency-injection RBAC validators
│   └── security.py       # Current user payload retrievers
├── database/
│   ├── connection.py     # SQLAlchemy DB engine, session & metadata base
│   ├── dependencies.py   # Database session context provider
│   └── redisd_setup.py   # Redis client connection configuration
├── exception/
│   └── password.py       # Password validation exceptions
├── models/
│   ├── refreshmodel.py   # Token refresh SQLAlchemy schema
│   └── usermodel.py      # User profile SQLAlchemy schema
├── router/
│   ├── admin_route.py    # Admin endpoint routes
│   └── user_route.py     # Authentication, registration & profile routes
├── schema/
│   ├── admin_schema.py   # Pydantic payloads for admin console
│   └── user_schema.py    # Pydantic login, signup & OTP validation definitions
├── Dockerfile            # Container definition
├── main.py               # Main application hook & exception mapping
└── requirements.txt      # Python dependencies
```

## Running the Service

### Using Docker (Compose)
From the root `E-com` folder:
```bash
docker-compose up -d auth-db auth-service
```

### Local Setup (Manual)
1. **Prepare Virtual Environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Database and Redis Setup**:
   Ensure PostgreSQL is running with a database named `auth_db`, and a local Redis server is active.

3. **Configure Environment Variables**:
   Create a `.env` file in this directory based on the following template:
   ```env
   DATABASE_URL=postgresql://postgres:123456@localhost:5432/auth_db
   REDIS_HOST=localhost
   REDIS_PORT=6379
   SECRET_KEY=your_jwt_secret_key
   ALGORITHM=HS256
   ```

4. **Start Application**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

---

## API Endpoints

### User Endpoints (`/api/v1/user`)

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `POST` | `/request-otp` | Validates details and requests OTP dispatch to the user's email. | None |
| `POST` | `/signup` | Verifies the OTP and registers the user. | None |
| `POST` | `/login` | Authenticates user credentials and returns tokens. | None |
| `POST` | `/refresh` | Generates a new access token using a refresh token. | None |
| `GET` | `/profile` | Retrieves current logged-in user payload. | JWT Access Token |
| `PATCH` | `/change_password` | Updates user password after checking current password. | JWT Access Token |
| `GET` | `/logout` | Invalidates the user session by deleting the refresh token. | JWT Access Token |
| `GET` | `/users/{user_id}` | Retrieves general information about a user. | JWT Access Token |

### Admin Endpoints (`/api/v1/admin`)

| Method | Endpoint | Description | Auth Requirement |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Retrieves a list of all customers and managers. | Admin |
| `GET` | `/inventory_mgr` | Retrieves a list of all inventory managers. | Admin |
| `GET` | `/customer` | Retrieves a list of all customer profiles. | Admin |
| `GET` | `/{id}` | Retrieves profile of a specific user. | Admin |
| `PATCH` | `/{id}` | Updates details or role of a specific user. | Admin |
| `DELETE` | `/inventory_mgr/{id}` | Removes a manager account. | Admin |
| `DELETE` | `/customer/{id}` | Removes a customer account. | Admin |
