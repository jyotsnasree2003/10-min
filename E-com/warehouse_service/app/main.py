from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app.routers import warehouses

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Warehouse Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(warehouses.router,prefix="/api/v1")


@app.get("/health")
def health():
    return {"status": "ok"}
