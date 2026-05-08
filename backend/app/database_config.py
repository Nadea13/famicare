"""
database_config.py
──────────────────
Async SQLAlchemy engine, session factory, and database dependency.
Uses asyncpg as the PostgreSQL driver for fully async operations.
"""

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.dependencies import get_settings

settings = get_settings()

# ── Async Engine ─────────────────────────────────────────────
# Fix for Railway/Heroku/Render: ensure URL starts with 'postgresql+asyncpg://'
db_url = settings.DATABASE_URL
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
elif "postgresql+asyncpg://" not in db_url:
    # If it's a relative path or something else, it might need more logic, 
    # but for typical cloud DBs, this handles most cases.
    pass

engine = create_async_engine(
    db_url,
    echo=settings.APP_ENV == "development",  # SQL logging in dev
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
)


# ── Session Factory ──────────────────────────────────────────
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


# ── FastAPI Dependency ───────────────────────────────────────
async def get_db() -> AsyncSession:
    """
    Yields an async database session for each request.
    Automatically commits on success, rolls back on exception.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
