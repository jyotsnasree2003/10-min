from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.routers import orders


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables are created in SQLite on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Order Service",
    description="FastAPI migration of the Django Order Service",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development only
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(
    orders.router,
    prefix="/api/v1"
)

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "healthy"}