import os
import sys
from logging.config import fileConfig

from alembic import context
from sqlalchemy import engine_from_config, pool

sys.path.append(os.path.join(sys.path[0], "backend"))

from backend.config import DB_PASS, DB_HOST, DB_PORT, DB_NAME, DB_USER


# 1) Обязательно общая метадата и один Base
from backend.database import Base

# 2) Затем импорт всех моделей, чтобы они регистрировались в Base.metadata:
import backend.models.auth
import backend.models.learn


target_metadata = Base.metadata

# this is the Alembic Config object, which provides
# access to the values within the .ini file in use.
config = context.config

section = config.config_ini_section

# (если хочешь сохранить старые подстановки в ini)
config.set_section_option(section, "DB_USER", str(DB_USER))
config.set_section_option(section, "DB_PASS", str(DB_PASS))
config.set_section_option(section, "DB_HOST", str(DB_HOST))
config.set_section_option(section, "DB_NAME", str(DB_NAME))
config.set_section_option(section, "DB_PORT", str(DB_PORT))


def make_sync_dsn(user, password, host, port, name):
    IS_WINDOWS = os.name == "nt"

    if host.startswith("/") and not IS_WINDOWS:  # UNIX-сокет
        return f"postgresql+psycopg2://{user}:{password}@/{name}?host={host}"
    suffix = f":{port}" if port else ""
    return f"postgresql+psycopg2://{user}:{password}@{host}{suffix}/{name}"


# КЛЮЧ: Alembic должен получить синхронный URL
ALEMBIC_URL = make_sync_dsn(DB_USER, DB_PASS, DB_HOST, DB_PORT, DB_NAME)
config.set_main_option("sqlalchemy.url", ALEMBIC_URL)


# Interpret the config file for Python logging.
# This line sets up loggers basically.
if config.config_file_name is not None:
    fileConfig(config.config_file_name)



def run_migrations_offline() -> None:
    """Run migrations in 'offline' mode.

    This configures the context with just a URL
    and not an Engine, though an Engine is acceptable
    here as well.  By skipping the Engine creation
    we don't even need a DBAPI to be available.

    Calls to context.execute() here emit the given string to the
    script output.

    """
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in 'online' mode.

    In this scenario we need to create an Engine
    and associate a connection with the context.

    """
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection, target_metadata=target_metadata
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
