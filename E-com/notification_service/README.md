# Notification Service

The **Notification Service** handles the creation, storage, and dispatch of user notifications, specializing in OTP (One-Time Password) generation and validation messages. It integrates with Redis to store pending registration records and uses SMTP to dispatch verification emails to users.

## Features

- **OTP Generation & Verification**: Automatically constructs 6-digit cryptographic verification codes when registration is initiated.
- **Redis Cache Storage**: Temporarily stores user signup credentials and generated OTP values in Redis with a strict 60-second expiration lifecycle.
- **SMTP Mail Dispatch**: Utilizes `fastapi_mail` coupled with Google's Gmail SMTP servers to deliver HTML OTP notifications to recipient addresses.

## Directory Structure

```text
notification_service/
├── database/
│   └── redis_setup.py      # Redis client initializer
├── router/
│   └── validation.py       # OTP generation and email dispatch routes
├── schema/
│   └── otp.py              # Pydantic user registration validation schema
├── Dockerfile              # Container definition
├── main.py                 # FastAPI configuration, routes, and middleware setup
└── requirements.txt        # Python dependencies
```

## Running the Service

### Using Docker (Compose)
From the root `E-com` folder:
```bash
docker-compose up -d redis notification-service
```

### Local Setup (Manual)
1. **Prepare Virtual Environment**:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Redis Setup**:
   Ensure a local Redis server is active.

3. **Configure Environment Variables**:
   Create a `.env` file in this directory with SMTP settings:
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   EMAIL=your_smtp_gmail_username@gmail.com
   EMAIL_PASSWORD=your_app_specific_gmail_password
   ```

4. **Start Application**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8008 --reload
   ```

---

## API Endpoints

### OTP Validation Endpoints (`/api/v1`)

| Method | Endpoint | Description | Payload Schema |
| :--- | :--- | :--- | :--- |
| `POST` | `/generate-otp` | Generates a 6-digit OTP, mails it to the user, and caches registration details in Redis. | `CreateUser` |
