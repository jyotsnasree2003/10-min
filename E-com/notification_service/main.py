from fastapi import FastAPI
from router.validation import routers
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title='Notification service')

app.include_router(routers, prefix='/api/v1')
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # or restrict to specific origins, see note below
    allow_credentials=False,      # see note below
    allow_methods=["*"],          # GET, POST, PATCH, DELETE, OPTIONS, etc.
    allow_headers=["*"],          # lets your Authorization: Bearer header through
)