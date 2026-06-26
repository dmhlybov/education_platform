import os
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from backend.config import DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_NAME

from sqlalchemy.orm import declarative_base

Base = declarative_base()


IS_WINDOWS = os.name == "nt"

if DB_HOST.startswith("/") and not IS_WINDOWS:
    DATABASE_URL = f"postgresql+asyncpg://{DB_USER}:{DB_PASS}@/{DB_NAME}?host={DB_HOST}"
else:
    port_part = f":{DB_PORT}" if DB_PORT else ""
    host = DB_HOST if not DB_HOST.startswith("/") else "localhost"
    DATABASE_URL = (
        f"postgresql+asyncpg://{DB_USER}:{DB_PASS}@{host}{port_part}/{DB_NAME}"
    )


engine = create_async_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_size=10,  # Размер пула соединений
    max_overflow=20,  # Максимальное количество дополнительных соединений
    # echo=True  # Включает логирование SQL-запросов (для отладки)
)

custom_async_session_maker = async_sessionmaker(engine, expire_on_commit=False)


async def get_async_session() -> AsyncGenerator[AsyncSession, None]:
    async with custom_async_session_maker() as session:
        yield session
