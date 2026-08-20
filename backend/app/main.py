from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401 - registers all models on Base before create_all
from app.core.config import get_settings
from app.core.database import Base, engine
from app.routers import (
    analytics,
    assets,
    auth,
    device_health,
    devices,
    events,
    gamification,
    health,
    incidents,
    notifications,
    webhooks,
    ws,
)

settings = get_settings()

app = FastAPI(title="HostDost API", version="0.1.0")

# No alembic in this build - create tables directly on startup instead of via migrations.
Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (
    health.router,
    auth.router,
    webhooks.router,
    devices.router,
    assets.router,
    events.router,
    device_health.router,
    incidents.router,
    notifications.router,
    gamification.router,
    analytics.router,
):
    app.include_router(router, prefix=settings.api_v1_prefix)

# Mounted at the literal /ws/devices/{device_id} path (no /api/v1 prefix), matching
# the architecture spec.
app.include_router(ws.router)