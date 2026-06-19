"""
Database setup — configurable between SQLite and MongoDB.
Switch by setting DB_TYPE in .env:
  DB_TYPE=sqlite   DATABASE_URL=sqlite:///./injurylens.db   (default)
  DB_TYPE=mongodb  MONGODB_URL=mongodb://localhost:27017
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from config import settings


class Base(DeclarativeBase):
    pass


# SQLite / any SQL backend via SQLAlchemy
_connect_args = {"check_same_thread": False} if settings.DB_TYPE == "sqlite" else {}

engine = create_engine(settings.DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Create all tables. Call once at startup."""
    from auth_models import User  # noqa: F401 — import so Base registers the table
    Base.metadata.create_all(bind=engine)
