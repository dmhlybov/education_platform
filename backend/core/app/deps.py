from fastapi import Depends


from backend.schemas.auth import UserContext
from backend.core.services.user_config import (
    current_active_user,
    current_superuser,
    current_verified_user,
)
from backend.models.auth import User


def _to_ctx(u: User) -> UserContext:
    return UserContext(
        id=u.id,
        email=u.email,
        is_active=u.is_active,
        is_verified=u.is_verified,
        is_admin=u.is_admin,
    )


async def current_active_user_ctx(
    user: User = Depends(current_active_user),
) -> UserContext:
    return _to_ctx(user)


async def current_superuser_ctx(user: User = Depends(current_superuser)) -> UserContext:
    return _to_ctx(user)


async def current_verified_user_ctx(
    user: User = Depends(current_verified_user),
) -> UserContext:
    return _to_ctx(user)
