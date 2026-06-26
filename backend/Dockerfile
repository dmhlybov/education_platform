# syntax=docker/dockerfile:1.7
FROM python:3.10-slim AS build
WORKDIR /app


# 1) зависимости: сначала requirements (кэшируем)
COPY requirements.txt .

# Собираем wheels, чтобы ускорить и стабилизировать установку
RUN --mount=type=cache,target=/root/.cache/pip \
    pip wheel --wheel-dir=/wheels -r requirements.txt \
    && pip wheel --wheel-dir=/wheels psycopg2-binary==2.9.10

# 2) код
COPY backend/ ./backend
COPY alembic.ini ./alembic.ini
COPY migration/ ./migration

FROM python:3.10-slim
WORKDIR /app

# Установка из wheels (быстро, без компиляций/скачиваний при наличии кэша)
COPY --from=build /wheels /wheels
RUN pip install --no-cache-dir /wheels/* && rm -rf /wheels

COPY --from=build /app/backend ./backend
COPY --from=build /app/alembic.ini ./alembic.ini
COPY --from=build /app/migration ./migration

ENV PYTHONUNBUFFERED=1
EXPOSE 8003
CMD ["python","-m","backend.main"]
