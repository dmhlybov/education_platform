from typing import Optional, Union
from datetime import datetime, timezone
import logging

from fastapi import Depends, Request, Response
from fastapi_users import BaseUserManager, IntegerIDMixin, InvalidPasswordException
from fastapi_users_db_sqlalchemy import SQLAlchemyUserDatabase

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import update

from backend.config import SECRET

from backend.models.auth import User
from backend.schemas.auth import UserCreate

from backend.database import custom_async_session_maker, get_async_session

logger = logging.getLogger(__name__)


async def get_user_db(session: AsyncSession = Depends(get_async_session)):
    yield SQLAlchemyUserDatabase(session, User)


class UserManager(IntegerIDMixin, BaseUserManager[User, int]):
    reset_password_token_secret = SECRET
    verification_token_secret = SECRET

    async def on_after_login(
        self,
        user: User,
        request: Optional[Request] = None,
        response: Optional[Response] = None,
    ):
        logger.info(f"User {user.username} logged in.")

        async with custom_async_session_maker() as session:
            query = (
                update(User)
                .where(User.email == user.email)
                .values(last_login=datetime.now(timezone.utc))
            )
            await session.execute(query)
            await session.commit()

    async def on_after_register(self, user: User, request: Optional[Request] = None):
        logger.info(f"User {user.username} has registered.")

    async def on_after_forgot_password(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        logger.info(
            f"User {user.username} has forgot their password. Reset token: {token}"
        )

    async def on_after_request_verify(
        self, user: User, token: str, request: Optional[Request] = None
    ):
        logger.info(
            f"Verification requested for user {user.username}. Verification token: {token}"
        )

    async def validate_password(
        self,
        password: str,
        user: Union[UserCreate, User],
    ) -> None:
        if len(password) < 8:
            raise InvalidPasswordException(
                reason="Пароль должен быть длиннее 8 символов"
            )
        if user.email in password:
            raise InvalidPasswordException(reason="Email и пароль не должны совпадать")


async def get_user_manager(user_db=Depends(get_user_db)):
    yield UserManager(user_db)
