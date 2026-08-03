from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os
from dotenv import load_dotenv

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
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker( bind=engine)
Base = declarative_base()


# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()