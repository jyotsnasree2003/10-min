from fastapi import FastAPI

from database.connection import Base, engine
from routers.inventoryrouter import router as inventory_router

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI( title="Inventory Service")

# Create tables automatically
Base.metadata.create_all(bind=engine)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
app.include_router(inventory_router,prefix='/api/v1')


@app.get("/")
def root():
    return {
        "message": "Inventory Service is Running"
    }