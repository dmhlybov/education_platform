import asyncio
import logging
import contextvars


# В формат добавили поле user
FMT = "%(asctime)s - %(levelname)s - %(filename)s:%(lineno)d - %(funcName)s - [user=%(user)s] - %(message)s"

# Контекстная переменная с email текущего пользователя
user_email_var: contextvars.ContextVar[str] = contextvars.ContextVar(
    "user_email", default="-"
)


class ContextFilter(logging.Filter):
    def filter(self, record: logging.LogRecord) -> bool:
        # гарантируем наличие поля user в любом логе
        try:
            record.user = user_email_var.get("-")
        except Exception:
            record.user = "-"
        return True


_LOGGING_INITIALIZED = False


def setup_logging(app=None) -> logging.Logger:
    """
    Идемпотент: безопасно вызывать несколько раз — повторных хендлеров не создаст.
    """
    global _LOGGING_INITIALIZED
    if _LOGGING_INITIALIZED:
        return logging.getLogger()

    root = logging.getLogger()
    root.setLevel(logging.INFO)

    # Консоль
    sh = logging.StreamHandler()
    sh.setFormatter(logging.Formatter(FMT))
    sh.addFilter(ContextFilter())
    root.addHandler(sh)

    # Логгер ошибок — в файл
    err = logging.getLogger("errors")
    if not err.handlers:
        fh = logging.FileHandler("errors.log")
        fh.setLevel(logging.ERROR)
        fh.setFormatter(logging.Formatter(FMT))
        fh.addFilter(ContextFilter())
        err.addHandler(fh)
        err.setLevel(logging.ERROR)

    # uvicorn.access — чтобы видеть user и там
    access = logging.getLogger("uvicorn.access")
    ah = logging.StreamHandler()
    ah.setFormatter(logging.Formatter(FMT))
    ah.addFilter(ContextFilter())
    access.addHandler(ah)
    access.setLevel(logging.INFO)

    _LOGGING_INITIALIZED = True
    return root


async def enable_asyncio_debug():
    loop = asyncio.get_running_loop()
    loop.set_debug(True)
    loop.slow_callback_duration = 0.05
    logging.getLogger("asyncio").setLevel(logging.WARNING)
