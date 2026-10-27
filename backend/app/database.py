import os
from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_PATH = os.path.join(BASE_DIR, "emergency.db")
SQLALCHEMY_DATABASE_URL = f"sqlite:///{DB_PATH}"

# check_same_thread=False allows FastAPI multi-threaded requests
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def run_migrations(db_engine):
    """
    Safely upgrades existing SQLite database schema without dropping or altering existing records.
    Adds `is_verified`, `verified_at`, and `verified_by` columns to the `incidents` table if missing.
    """
    with db_engine.connect() as conn:
        cursor = conn.execute(text("PRAGMA table_info(incidents)"))
        existing_cols = {row[1] for row in cursor.fetchall()}

        if existing_cols:
            if "is_verified" not in existing_cols:
                conn.execute(text("ALTER TABLE incidents ADD COLUMN is_verified BOOLEAN DEFAULT 0"))
            if "verified_at" not in existing_cols:
                conn.execute(text("ALTER TABLE incidents ADD COLUMN verified_at DATETIME"))
            if "verified_by" not in existing_cols:
                conn.execute(text("ALTER TABLE incidents ADD COLUMN verified_by VARCHAR(50)"))
            conn.commit()

def get_db():
    """Dependency that provides a database session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
