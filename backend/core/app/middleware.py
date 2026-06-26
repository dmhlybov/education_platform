import time
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware

from backend.core.app.logging import setup_logging

logger = setup_logging(None)


async def log_requests(request: Request, call_next):
    start_time = time.time()

    try:
        response = await call_next(request)
    except Exception as e:
        logger.exception(f"Ошибка при обработке запроса: {e}")
        raise

    process_time = time.time() - start_time
    logger.info(f"Завершено за {process_time:.4f} сек")
    return response


def setup_middleware(app):
    app.middleware("http")(log_requests)

    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
