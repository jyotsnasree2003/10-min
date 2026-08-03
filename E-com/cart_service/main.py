from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database.connection import Base, engine
from routers.cartrouter import router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cart Service"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router,prefix='/api/v1')


@app.get("/")
async def home():
    return {
        "message": "Cart Service Running Successfully"
    }