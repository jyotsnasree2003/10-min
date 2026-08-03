from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import location, warehouses, internal,home

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Location Service", version="0.1.0")

# Allow CORS for all origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # Allow all origins
    allow_credentials=False,    # Must be False when using "*"
    allow_methods=["*"],        # Allow all HTTP methods
    allow_headers=["*"],        # Allow all headers
)

app.include_router(warehouses.router,prefix="/api/v1")
app.include_router(location.router,prefix="/api/v1")
app.include_router(internal.router,prefix="/api/v1")
app.include_router(home.router,prefix="/api/v1")


@app.get("/Test")
def Test():
    return {"status": "ok"}