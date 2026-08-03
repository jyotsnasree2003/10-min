from models.usermodel import UserModel
from models.refreshmodel import RefreshModel
from database.connection import Base, engine
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from router.user_route import router as user_router
from router.admin_route import router as admin_router
from exception.password import PasswordValidationException
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title='Auth service')
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # or restrict to specific origins, see note below
    allow_credentials=True,      # see note below
    allow_methods=["*"],          # GET, POST, PATCH, DELETE, OPTIONS, etc.
    allow_headers=["*"],          # lets your Authorization: Bearer header through
)
app.include_router(user_router, prefix='/api/v1/user')
app.include_router(admin_router, prefix='/api/v1/admin')
Base.metadata.create_all(bind=engine)

@app.exception_handler(Exception)
async def password_exception_handler(
    request: Request,
    exc: PasswordValidationException
):
    return JSONResponse(
        status_code=400,
        content={
            "detail": str(exc)
        }
    )