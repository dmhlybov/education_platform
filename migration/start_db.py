from sqlalchemy import create_engine
from sqlalchemy.engine import URL
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

from backend.config import DB_PASS, DB_HOST, DB_PORT, DB_NAME, DB_USER
from backend.database import Base

import backend.models.auth
import backend.models.learn


DATABASE_URL = URL.create(
    drivername="postgresql+psycopg2",
    username=DB_USER,
    password=DB_PASS,
    host=DB_HOST,
    port=int(DB_PORT) if DB_PORT else None,
    database=DB_NAME,
)

engine = create_engine(DATABASE_URL)

Base.metadata.create_all(bind=engine)

print("Tables created")
