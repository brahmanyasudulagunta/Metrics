import os
import logging
from .database import engine, SessionLocal
from .models import Base, User
from api.security import hash_password

logger = logging.getLogger(__name__)

DEV_MODE = os.getenv("DEV_MODE", "false").lower() == "true"

import time
from sqlalchemy.exc import OperationalError

def init_db():
    """Create tables and seed default admin user with retries for DB readiness."""
    max_retries = 10
    retry_interval = 5
    
    for attempt in range(max_retries):
        try:
            logger.info(f"Connecting to database (attempt {attempt + 1}/{max_retries})...")
            Base.metadata.create_all(bind=engine)
            break
        except OperationalError as e:
            if attempt == max_retries - 1:
                logger.error("Could not connect to database after maximum retries.")
                raise e
            logger.warning(f"Database not ready yet, retrying in {retry_interval}s...")
            time.sleep(retry_interval)
    
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.username == "admin").first()
        default_pw = os.getenv("ADMIN_PASSWORD", "admin")

        if not admin:
            # First boot — create admin
            admin = User(
                username="admin",
                hashed_password=hash_password(default_pw),
                must_change_password=not DEV_MODE  # Skip change-password in dev
            )
            db.add(admin)
            db.commit()
            logger.info("Created default admin user.")
        elif DEV_MODE:
            # Dev mode — always reset password to env var value
            admin.hashed_password = hash_password(default_pw)
            admin.must_change_password = False
            db.commit()
            logger.info("DEV_MODE: Reset admin password to ADMIN_PASSWORD env var.")
        else:
            logger.info("Admin user already exists, skipping seed.")
    finally:
        db.close()

if __name__ == "__main__":
    init_db()
