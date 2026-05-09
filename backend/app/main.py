"""
main.py — FamiCare FastAPI Application Entry Point.
Configures CORS, registers routers, and handles startup events.
"""
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.dependencies import get_settings

from app.database_config import engine
from app.models.base_model import Base
from app.routers import line_webhook_router, health_log_router, auth_router

# ── Monitoring (Sentry) ──────────────────────────────────────
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration

settings = get_settings()

if settings.SENTRY_DSN:
    sentry_sdk.init(
        dsn=settings.SENTRY_DSN,
        integrations=[FastApiIntegration()],
        traces_sample_rate=1.0,
        environment=settings.APP_ENV,
    )
    logging.info("🎯 Sentry monitoring initialized")


# ── Logging ──────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)



# ── Lifespan (startup / shutdown) ────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: create tables. Shutdown: dispose engine."""
    logger.info("🚀 FamiCare API starting up...")
    logger.info(f"   Environment: {settings.APP_ENV}")

    # Create all tables (Ensures Railway has tables on startup)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        logger.info("✅ Database tables created/verified")


    yield

    await engine.dispose()
    logger.info("👋 FamiCare API shut down.")


@app.middleware("http")
async def add_security_headers(request, call_next):
    response = await call_next(request)
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    # HSTS only if in production
    if settings.APP_ENV == "production":
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response



# ── App Instance ─────────────────────────────────────────────
from app.limiter import limiter
app = FastAPI(
    title="FamiCare API",
    description="HealthTech SaaS for tracking elderly health data via LINE bot & Web Dashboard",
    version="0.1.0",
    lifespan=lifespan,
)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)



# ── CORS ─────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.FRONTEND_URL,
        "http://localhost:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static Files (uploaded images) ───────────────────────────
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# ── Routers ──────────────────────────────────────────────────
from app.routers import (
    line_webhook_router,
    health_log_router,
    auth_router,
    patient_router,
    family_member_router,
    dashboard_router
)

app.include_router(line_webhook_router)
app.include_router(health_log_router)
app.include_router(auth_router)
app.include_router(patient_router)
app.include_router(family_member_router)
app.include_router(dashboard_router)


# ── Health Check ─────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def health_check():
    return {
        "status": "healthy",
        "service": "FamiCare API",
        "version": "0.1.0",
    }
