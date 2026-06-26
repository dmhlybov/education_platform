from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from backend.config import UPLOADS_DIR, SCORM_DIR
from backend.core.app.middleware import setup_middleware
from backend.core.app.exceptions import setup_exception_handlers
from backend.core.app.logging import setup_logging
from backend.core.app.router import setup_router
from backend.core.app.startup import startup_event, shutdown_event

from contextlib import asynccontextmanager


def create_app() -> FastAPI:
    setup_logging()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        await startup_event(app)  # твой существующий startup
        yield
        await shutdown_event(app)  # твой существующий shutdown

    app = FastAPI(
        title="Learning Platform API", lifespan=lifespan, redirect_slashes=False
    )

    setup_middleware(app)
    setup_exception_handlers(app)
    setup_router(app)

    app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")
    app.mount("/scorm", StaticFiles(directory=str(SCORM_DIR)), name="scorm")

    return app
