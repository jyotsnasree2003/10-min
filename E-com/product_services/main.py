from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.database import Base, engine

from routers.brand import router as brand_router
from routers.category import router as category_router
from routers.products import router as product_router
from routers.product_image import router as product_image_router

app = FastAPI(
    title="Product Service",
    version="1.0.0"
)

# Create Tables
Base.metadata.create_all(bind=engine)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(product_router, prefix="/api/v1")
app.include_router(category_router, prefix="/api/v1")
app.include_router(brand_router, prefix="/api/v1")
app.include_router(product_image_router, prefix="/api/v1")


@app.get("/")
def root():
    return {
        "message": "Product Service is Running"
    }


@app.get("/health")
def health():
    return {
        "status": "ok"
    }