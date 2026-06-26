import logging
from typing import Any
from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError, ResponseValidationError
from pydantic import ValidationError as PydanticValidationError
from sqlalchemy.exc import SQLAlchemyError

logger = logging.getLogger("errors")


def _endpoint_name(request: Request) -> str:
    ep = request.scope.get("endpoint")
    return getattr(ep, "__name__", "unknown_endpoint")


def _json(status: int, endpoint: str, detail: Any) -> JSONResponse:
    return JSONResponse(
        status_code=status, content={"endpoint": endpoint, "detail": detail}
    )


# --------- FastAPI / Pydantic / SQLAlchemy ---------


async def handle_request_validation(request: Request, exc: RequestValidationError):
    ep = _endpoint_name(request)
    msg = (
        exc.errors()[0].get("msg", "Ошибка валидации входных данных")
        if exc.errors()
        else "Ошибка валидации входных данных"
    )
    logger.warning("Request validation failed in %s: %s", ep, msg, exc_info=True)
    return _json(422, ep, msg)


async def handle_response_validation(request: Request, exc: ResponseValidationError):
    ep = _endpoint_name(request)
    msg = (
        exc.errors()[0].get("msg", "Ответ не соответствует ожидаемой схеме")
        if exc.errors()
        else "Ответ не соответствует ожидаемой схеме"
    )
    logger.error(
        "Response validation failed in %s: %s", ep, exc.errors(), exc_info=True
    )
    return _json(502, ep, msg)


async def handle_pydantic_validation(request: Request, exc: PydanticValidationError):
    ep = _endpoint_name(request)
    msg = (
        exc.errors()[0].get("msg", "Внутренняя ошибка валидации данных")
        if exc.errors()
        else "Внутренняя ошибка валидации данных"
    )
    logger.error("Pydantic validation error in %s: %s", ep, exc.errors(), exc_info=True)
    return _json(502, ep, msg)


async def handle_sqlalchemy(request: Request, exc: SQLAlchemyError):
    ep = _endpoint_name(request)
    msg = str(exc)
    logger.error("DB error in %s: %s", ep, str(exc), exc_info=True)
    return _json(500, ep, msg)


# ----------------- FastAPI HTTPException и «прочие» -----------------


async def handle_fastapi_http(request: Request, exc: HTTPException):
    ep = _endpoint_name(request)
    detail = exc.detail
    logger.warning("HTTP error in %s: %s %r", ep, exc.status_code, detail)

    if exc.status_code == status.HTTP_403_FORBIDDEN:
        logger.warning(
            f"Доступ запрещён (403) в функции {ep}. Пользователь попытался выполнить недоступный ему запрос."
        )
        return _json(403, ep, "Недостаточно прав")

    if exc.status_code == status.HTTP_401_UNAUTHORIZED:
        logger.warning("Неавторизированный пользователь")
        return _json(401, ep, "Необходимо авторизироваться")

    return _json(exc.status_code, ep, detail)


async def handle_unexpected(request: Request, exc: Exception):
    ep = _endpoint_name(request)
    msg = str(exc) or "Внутренняя ошибка сервера"
    logger.exception("Unhandled exception in %s: %r", ep, msg)
    return _json(500, ep, msg)


# ----------------- Регистрация -----------------


def setup_exception_handlers(app):
    # FastAPI / Pydantic / DB
    app.add_exception_handler(RequestValidationError, handle_request_validation)
    app.add_exception_handler(ResponseValidationError, handle_response_validation)
    app.add_exception_handler(PydanticValidationError, handle_pydantic_validation)
    app.add_exception_handler(SQLAlchemyError, handle_sqlalchemy)

    # HTTPException и «прочие»
    app.add_exception_handler(HTTPException, handle_fastapi_http)
    app.add_exception_handler(Exception, handle_unexpected)

    return app
