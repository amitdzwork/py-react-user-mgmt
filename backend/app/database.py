import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DB_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://postgres:password@localhost:5432/userdb"  # local fallback
)
TESTING = os.getenv("TESTING") == "1"

engine = create_engine(DB_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def wait_for_db(max_retries: int = 10, delay: float = 0.5) -> None:
    """
    Try to establish a connection with bounded retries and exponential backoff.
    Skips entirely when TESTING=1 so pytest doesn't hang.
    """
    if TESTING:
        return
    last_err = None
    for _ in range(max_retries):
        try:
            with engine.connect() as conn:
                conn.execute("SELECT 1")  # lightweight ping
            return
        except Exception as e:
            last_err = e
            time.sleep(delay)
            delay = min(delay * 2, 5.0)  # cap backoff
    raise RuntimeError(f"Database not reachable after {max_retries} attempts: {last_err}")
