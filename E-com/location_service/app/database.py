import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

load_dotenv()

# PostgreSQL Connection URL
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    user = os.getenv("DB_USER", "postgres")
    password = os.getenv("DB_PASSWORD", "123456")
    host = os.getenv("DB_HOST", "location-db")
    port = os.getenv("DB_PORT", "5432")
    db = os.getenv("DB_NAME", "location_db")
    DATABASE_URL = f"postgresql+psycopg2://{user}:{password}@{host}:{port}/{db}"


engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()