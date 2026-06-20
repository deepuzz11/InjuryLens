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
    """Create all tables and apply lightweight column migrations."""
    from auth_models import User  # noqa: F401 — import so Base registers the table
    from sqlalchemy import inspect, text

    Base.metadata.create_all(bind=engine)

    # SQLite's CREATE TABLE IF NOT EXISTS won't add new columns to existing tables.
    # Manually add any columns that were introduced after the initial schema.
    if settings.DB_TYPE == "sqlite":
        inspector = inspect(engine)
        if inspector.has_table("users"):
            existing = {c["name"] for c in inspector.get_columns("users")}
            migrations = [
                ("reset_token",         "ALTER TABLE users ADD COLUMN reset_token VARCHAR(128)"),
                ("reset_token_expires",  "ALTER TABLE users ADD COLUMN reset_token_expires DATETIME"),
            ]
            with engine.connect() as conn:
                for col, stmt in migrations:
                    if col not in existing:
                        conn.execute(text(stmt))
                conn.commit()
