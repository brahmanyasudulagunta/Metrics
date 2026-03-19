from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

DATABASE_URL = os.getenv("SQLALCHEMY_DATABASE_URL")

if not DATABASE_URL:
    # Build from components if full URL is not provided
    user = os.getenv("POSTGRES_USER", "metrics_user")
    pw = os.getenv("POSTGRES_PASSWORD", "metrics_pass")
    db = os.getenv("POSTGRES_DB", "metrics_db")
    host = os.getenv("POSTGRES_HOST", "postgres")
    port = os.getenv("POSTGRES_PORT", "5432")
    DATABASE_URL = f"postgresql://{user}:{pw}@{host}:{port}/{db}"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
