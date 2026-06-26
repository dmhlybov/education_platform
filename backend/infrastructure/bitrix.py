from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, status

from backend.config import (
    BITRIX_CLIENT_ID,
    BITRIX_CLIENT_SECRET,
    BITRIX_FIRST_ADMIN_ID,
    BITRIX_PORTAL,
    BITRIX_REDIRECT_URI,
)

PUBLIC_OAUTH_BASE = "https://oauth.bitrix.info"


def _check_oauth_config(*, require_secret: bool = False) -> None:
    missing: list[str] = []
    if not BITRIX_CLIENT_ID:
        missing.append("BITRIX_CLIENT_ID")
    if not BITRIX_REDIRECT_URI:
        missing.append("BITRIX_REDIRECT_URI")
    if require_secret and not BITRIX_CLIENT_SECRET:
        missing.append("BITRIX_CLIENT_SECRET")
    if missing:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bitrix OAuth config missing: {', '.join(missing)}",
        )


def parse_admin_ids() -> set[str]:
    if not BITRIX_FIRST_ADMIN_ID:
        return set()
    return {item.strip() for item in BITRIX_FIRST_ADMIN_ID.split(",") if item.strip()}


def build_authorize_url(state: str | None = None) -> str:
    _check_oauth_config(require_secret=False)
    oauth_base = _get_oauth_base()
    authorize_url = f"{oauth_base}/oauth/authorize/"
    params = {
        "client_id": BITRIX_CLIENT_ID,
        "redirect_uri": BITRIX_REDIRECT_URI,
        "response_type": "code",
    }
    if state:
        params["state"] = state
    return f"{authorize_url}?{urlencode(params)}"


async def exchange_code(code: str) -> dict:
    _check_oauth_config(require_secret=True)
    oauth_base = _get_oauth_base()
    token_url = f"{oauth_base}/oauth/token/"
    params = {
        "grant_type": "authorization_code",
        "client_id": BITRIX_CLIENT_ID,
        "client_secret": BITRIX_CLIENT_SECRET,
        "code": code,
        "redirect_uri": BITRIX_REDIRECT_URI,
    }
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(token_url, params=params)
    try:
        payload = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bitrix token response is not valid JSON",
        ) from exc

    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bitrix token request failed: {payload}",
        )
    if payload.get("error"):
        description = payload.get("error_description") or payload.get("error")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=description)
    return payload


def resolve_rest_endpoint(payload: dict) -> str:
    endpoint = payload.get("client_endpoint") or payload.get("server_endpoint")
    if endpoint:
        return _ensure_trailing_slash(str(endpoint))
    portal = (BITRIX_PORTAL or "").strip()
    if portal:
        if not portal.startswith("http"):
            portal = f"https://{portal}"
        portal = portal.rstrip("/")
        return f"{portal}/rest/"
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Bitrix portal is not configured",
    )


async def fetch_current_user(rest_endpoint: str, access_token: str) -> dict:
    url = f"{_ensure_trailing_slash(rest_endpoint)}user.current.json"
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.get(url, params={"auth": access_token})
    try:
        payload = response.json()
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bitrix user response is not valid JSON",
        ) from exc
    if response.status_code >= 400:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Bitrix user request failed: {payload}",
        )
    return payload


def _ensure_trailing_slash(value: str) -> str:
    return value if value.endswith("/") else f"{value}/"


def _normalize_portal_url() -> str:
    portal = (BITRIX_PORTAL or "").strip()
    if not portal:
        return ""
    if not portal.startswith("http"):
        portal = f"https://{portal}"
    return portal.rstrip("/")


def _get_oauth_base() -> str:
    portal = _normalize_portal_url()
    return portal or PUBLIC_OAUTH_BASE
