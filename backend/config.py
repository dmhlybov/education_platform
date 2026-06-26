from pathlib import Path
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent


load_dotenv(BASE_DIR / ".env.common")

if os.getenv("ENV") == "prod":
    load_dotenv(
        BASE_DIR / ".env.prod", override=True
    )  # no-op in Docker (file excluded from image)
else:
    load_dotenv(BASE_DIR / ".env.local", override=True)


PROXY_NAME = os.environ.get("PROXY_NAME", None)
PROXY_PASSWORD = os.environ.get("PROXY_PASSWORD", None)
PROXY_ADDRESS = os.environ.get("PROXY_ADDRESS", None)
PROXY_PORT = os.environ.get("PROXY_PORT", None)


def get_proxy_url() -> str | None:
    if PROXY_NAME and PROXY_PASSWORD and PROXY_ADDRESS and PROXY_PORT:
        return f"http://{PROXY_NAME}:{PROXY_PASSWORD}@{PROXY_ADDRESS}:{PROXY_PORT}"
    return None


SKIP_ON_STARTUP = os.environ.get("SKIP_ON_STARTUP", "0")
DB_USER = os.getenv("DB_USER", "")
DB_PASS = os.getenv("DB_PASS", "")
DB_HOST = os.getenv("DB_HOST", "")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "")


SECRET = os.environ.get("SECRET", "supersecretkey")

DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)

UPLOADS_DIR = BASE_DIR / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

SCORM_DIR = BASE_DIR / "data" / "scorm"
SCORM_DIR.mkdir(parents=True, exist_ok=True)

BITRIX_CLIENT_ID = os.getenv("BITRIX_CLIENT_ID")
BITRIX_CLIENT_SECRET = os.getenv("BITRIX_CLIENT_SECRET")
BITRIX_REDIRECT_URI = os.getenv("BITRIX_REDIRECT_URI")
BITRIX_PORTAL = os.getenv("BITRIX_PORTAL")
BITRIX_FIRST_ADMIN_ID = os.getenv("BITRIX_FIRST_ADMIN_ID")
