import logging
from backend.core.app.logging import enable_asyncio_debug

log = logging.getLogger(__name__)


async def startup_event(app):
    await enable_asyncio_debug()


async def shutdown_event(app): ...
