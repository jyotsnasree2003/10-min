import os
from dotenv import load_dotenv

# Load environment variables from .env if present
load_dotenv()

# JWT Settings
# Fall back to Django's insecure secret key for local development compatibility
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
load_dotenv()
user = os.getenv("DB_USER")
password = os.getenv("DB_PASSWORD")
host = os.getenv("DB_HOST")
port = os.getenv("DB_PORT")
db = os.getenv("DB_NAME")
# PostgreSQL Connection URL
DATABASE_URL = (
    f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{db}"
)

# Microservice URLs (from prompt mappings)
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://auth-service:8000")
PRODUCT_SERVICE_URL = os.getenv("PRODUCT_SERVICE_URL", "http://product-service:8002")
LOCATION_SERVICE_URL = os.getenv("LOCATION_SERVICE_URL", "http://location-service:8003")
WAREHOUSE_SERVICE_URL = os.getenv("WAREHOUSE_SERVICE_URL", "http://warehouse-service:8004")
INVENTORY_SERVICE_URL = os.getenv("INVENTORY_SERVICE_URL", "http://inventory-service:8005")
CART_SERVICE_URL = os.getenv("CART_SERVICE_URL", "http://cart-service:8006")
NOTIFICATION_SERVICE_URL = os.getenv("NOTIFICATION_SERVICE_URL", "http://notification-service:8008")
