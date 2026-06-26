from fastapi_users import FastAPIUsers
from fastapi_users.authentication import AuthenticationBackend, BearerTransport
from fastapi_users.authentication import JWTStrategy

from backend.infrastructure.user_manager import get_user_manager
from backend.models.auth import User

from backend.config import SECRET

JWT_LIFETIME_SECONDS = 7 * 24 * 60 * 60

transport = BearerTransport(tokenUrl="api/auth/login")

jwt_strategy = JWTStrategy(secret=SECRET, lifetime_seconds=JWT_LIFETIME_SECONDS)


def get_jwt_strategy() -> JWTStrategy:
    return JWTStrategy(secret=SECRET, lifetime_seconds=JWT_LIFETIME_SECONDS)


auth_backend = AuthenticationBackend(
    name="jwt", transport=transport, get_strategy=lambda: jwt_strategy
)


fastapi_users = FastAPIUsers[User, int](
    get_user_manager,
    [auth_backend],
)


get_user_manager_dep = fastapi_users.get_user_manager

current_active_user = fastapi_users.current_user(active=True)
current_superuser = fastapi_users.current_user(active=True, superuser=True)
current_verified_user = fastapi_users.current_user(active=True, verified=True)

current_user_optional = fastapi_users.current_user(optional=True)
