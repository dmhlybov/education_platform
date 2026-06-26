from typing import List
from datetime import datetime, timezone
import uuid

from fastapi import APIRouter, Depends, HTTPException, Path, Body, Request, status

from fastapi.responses import RedirectResponse
from fastapi.routing import APIRoute
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi_users import exceptions as fastapi_users_exceptions

from backend.core.app.deps import current_superuser_ctx

from backend.core.services.user_config import (
    get_jwt_strategy,
    get_user_manager_dep,
    jwt_strategy,
    fastapi_users,
    auth_backend,
)
from backend.infrastructure.bitrix import (
    build_authorize_url,
    exchange_code,
    fetch_current_user,
    parse_admin_ids,
    resolve_rest_endpoint,
)
from backend.infrastructure.user_manager import get_user_manager
from backend.schemas.auth import (
    UserRead,
    UserCreate,
    UserUpdate,
    ChangeUserPassword,
    CustomUserUpdate,
    LinkBitrixRequest,
    UserContext,
)
from backend.models.auth import User as User_model

from backend.database import get_async_session

router = APIRouter(prefix="/auth", tags=["Авторизация и все действия с пользователями"])

auth_router = fastapi_users.get_auth_router(auth_backend)

filtered_routes = []
for route in auth_router.routes:
    if isinstance(route, APIRoute):
        if route.path == "/logout":
            continue
        filtered_routes.append(route)

auth_router.routes = filtered_routes

router.include_router(auth_router)


users_router = fastapi_users.get_users_router(UserRead, UserUpdate)

filtered_routes = []
for route in users_router.routes:
    if isinstance(route, APIRoute):
        if "/{id}" in route.path and "PATCH" in route.methods:
            continue
        if route.path == "/me" and "PATCH" in route.methods:
            continue
        filtered_routes.append(route)

users_router.routes = filtered_routes

for route in users_router.routes:
    if route.path == "/me" and "GET" in route.methods:
        route.path = "/user/me"

    if route.path == "/{id}":
        if "GET" in route.methods:
            route.path = "/user/get/{id}"
        elif "PATCH" in route.methods:
            route.path = "/user/edit/{id}"
        elif "DELETE" in route.methods:
            route.path = "/user/delete/{id}"

        route.dependencies = [Depends(current_superuser_ctx)] + (
            route.dependencies or []
        )

router.include_router(users_router)


@router.post(
    "/user/no_active_register",
    summary="Создание неактивного пользователя (без админских прав)",
    description="Создаем неактивного пользователя в системе",
    response_description="Успешный алерт",
)
async def auth_common_user_register(
    update_data: UserCreate = Body(..., description="Данные пользователя"),
    user_manager=Depends(get_user_manager_dep),
):
    await user_manager.create(update_data)
    return {"detail": "Пользователь создан"}


@router.post(
    "/user/register",
    summary="Создание пользователя",
    description="Создаем пользователя в системе",
    response_description="Успешный алерт",
)
async def auth_user_register(
    update_data: UserCreate = Body(..., description="Данные пользователя"),
    user: UserContext = Depends(current_superuser_ctx),
    user_manager=Depends(get_user_manager_dep),
):
    await user_manager.create(update_data)
    return {"detail": "Пользователь создан"}


@router.patch(
    "/user/edit/{id}",
    summary="Редактирование пользователя",
    description="Редактируем поля имя, фамилия, email у пользователя",
    response_description="Успешный алерт",
)
async def auth_user_edit(
    id: int = Path(..., description="ID пользователя"),
    update_data: CustomUserUpdate = Body(..., description="Новые данные пользователя"),
    user: UserContext = Depends(current_superuser_ctx),
    user_manager=Depends(get_user_manager_dep),
):
    select_user = await user_manager.get(id)
    if not select_user:
        raise HTTPException(
            status_code=404, detail="Пользователя с выбранным ID не существует"
        )

    await user_manager.update(update_data, select_user)

    return {"detail": "Пользователь изменен"}


@router.get(
    "/user/get_all",
    summary="Функция получения всех пользователей",
    description="Получаем список всех пользователей",
    response_model=List[UserRead],
    response_description="Возвращает список объектов пользователей",
)
async def get_all_users(
    user: UserContext = Depends(current_superuser_ctx),
    user_manager=Depends(get_user_manager_dep),
    session: AsyncSession = Depends(get_async_session),
):
    query = select(User_model.id)
    result = await session.execute(query)
    users_ids = result.scalars().all()
    return [await user_manager.get(user_id) for user_id in users_ids]


@router.post(
    "/user/switch_active/{id}",
    summary="Функция бана/разбана пользователя",
    description='Смена статуса пользователя с "активный" на "неактивный" и наоборот',
    response_description="Успешный алерт",
)
async def auth_user_switch_active(
    id: int = Path(..., description="ID пользователя"),
    user: UserContext = Depends(current_superuser_ctx),
    user_manager=Depends(get_user_manager_dep),
):
    select_user = await user_manager.get(id)
    if not select_user:
        raise HTTPException(
            status_code=404, detail="Пользователя с выбранным ID не существует"
        )

    update_data = UserUpdate(is_active=not select_user.is_active)
    await user_manager.update(update_data, select_user)

    return {"detail": "Статус пользователя изменен"}


@router.post(
    "/user/switch_verified/{id}",
    summary="Функция верификации пользователя",
    description='Меняем статус пользователя с "не подтвержденный" на "подтвержденный" и наоборот',
    response_description="Успешный алерт",
)
async def auth_user_switch_verified(
    id: int = Path(..., description="ID пользователя"),
    user: UserContext = Depends(current_superuser_ctx),
    user_manager=Depends(get_user_manager_dep),
):
    select_user = await user_manager.get(id)
    if not select_user:
        raise HTTPException(
            status_code=404, detail="Пользователя с выбранным ID не существует"
        )

    update_data = UserUpdate(is_verified=not select_user.is_verified)
    await user_manager.update(update_data, select_user)

    return {"detail": "Статус пользователя изменен"}


@router.post(
    "/user/switch_superuser/{id}",
    summary="Функция предоставления админских доступов пользователю",
    description='Меняем статус пользователя с "админ" на "не админ" и наоборот',
    response_description="Успешный алерт",
)
async def auth_user_switch_superuser(
    id: int = Path(..., description="ID пользователя"),
    user: UserContext = Depends(current_superuser_ctx),
    user_manager=Depends(get_user_manager_dep),
):
    select_user = await user_manager.get(id)
    if not select_user:
        raise HTTPException(
            status_code=404, detail="Пользователя с выбранным ID не существует"
        )

    update_data = UserUpdate(is_admin=not select_user.is_admin)
    await user_manager.update(update_data, select_user)

    return {"detail": "Статус пользователя изменен"}


@router.post(
    "/user/change_password/{id}",
    summary="Сменить пароль любого пользователя (Admin only)",
    description="Смена пароля пользователя",
    response_description="Успешный алерт",
)
async def auth_user_change_password(
    id: int = Path(..., description="ID пользователя"),
    data: ChangeUserPassword = Body(..., description="Новый пароль"),
    user: UserContext = Depends(current_superuser_ctx),
    user_manager=Depends(get_user_manager_dep),
):
    select_user = await user_manager.get(id)
    if not select_user:
        raise HTTPException(
            status_code=404, detail="Пользователя с выбранным ID не существует"
        )

    await user_manager.validate_password(data.new_password, user)

    update_data = UserUpdate(password=data.new_password)
    await user_manager.update(update_data, select_user)

    return {"detail": "Пароль пользователя изменён"}


@router.post(
    "/user/admin_login/{id}",
    summary="Функция входа в аккаунт другого пользователя",
    response_description="Заходим в аккаунт другого пользователя по его user_id",
)
async def auth_user_admin_login(
    id: int = Path(..., description="ID пользователя"),
    user: UserContext = Depends(current_superuser_ctx),
    user_manager=Depends(get_user_manager_dep),
):
    select_user = await user_manager.get(id)

    if not select_user:
        raise HTTPException(
            status_code=404, detail="Пользователя с выбранным ID не существует"
        )

    token = await jwt_strategy.write_token(select_user)

    return {"access_token": token, "token_type": "bearer"}


@router.patch(
    "/user/link-bitrix/{id}",
    summary="Привязать/отвязать Bitrix ID пользователя",
    description="Устанавливает или снимает bitrix_user_id для указанного пользователя. Передайте null для отвязки.",
    response_description="Успешный алерт",
)
async def link_bitrix_user(
    id: int = Path(..., description="ID пользователя в системе"),
    data: LinkBitrixRequest = Body(...),
    user: UserContext = Depends(current_superuser_ctx),
    user_manager=Depends(get_user_manager_dep),
    session: AsyncSession = Depends(get_async_session),
):
    select_user = await user_manager.get(id)
    if not select_user:
        raise HTTPException(
            status_code=404, detail="Пользователя с выбранным ID не существует"
        )

    if data.bitrix_user_id:
        existing = await session.scalar(
            select(User_model).where(
                User_model.bitrix_user_id == data.bitrix_user_id,
                User_model.id != id,
            )
        )
        if existing:
            raise HTTPException(
                status_code=400,
                detail=f"Bitrix ID «{data.bitrix_user_id}» уже привязан к другому пользователю",
            )

    update_data = UserUpdate(bitrix_user_id=data.bitrix_user_id)
    await user_manager.update(update_data, select_user)
    return {"detail": "Bitrix ID обновлён"}


@router.get("/bitrix/login")
async def bitrix_login(state: str | None = None) -> RedirectResponse:
    url = build_authorize_url(state=state)
    return RedirectResponse(url)


@router.post("/bitrix/callback")
@router.options("/bitrix/callback")
async def bitrix_callback_check() -> dict:
    """Для проверки приложения в Bitrix24 (кнопка «Проверить приложение»). Возвращает 200."""
    return {"status": "ok"}


@router.get("/bitrix/callback")
async def bitrix_callback(
    request: Request,
    code: str | None = None,
    error: str | None = None,
    error_description: str | None = None,
    session: AsyncSession = Depends(get_async_session),
    user_manager=Depends(get_user_manager),
) -> dict:
    if error:
        detail = error_description or error
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=detail)
    if not code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Missing OAuth code"
        )

    token_payload = await exchange_code(code)
    access_token = token_payload.get("access_token")
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bitrix access token is missing",
        )

    rest_endpoint = resolve_rest_endpoint(token_payload)
    user_payload = await fetch_current_user(rest_endpoint, access_token)
    user_info = user_payload.get("result") if isinstance(user_payload, dict) else None
    if not isinstance(user_info, dict):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unexpected Bitrix user payload",
        )

    bitrix_id = str(user_info.get("ID") or "").strip()
    email = user_info.get("EMAIL")
    if not bitrix_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Bitrix user id is missing"
        )
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bitrix user email is missing",
        )

    first_name = user_info.get("NAME")
    second_name = user_info.get("LAST_NAME")

    admin_ids = parse_admin_ids()

    result = await session.execute(
        select(User_model).where(User_model.bitrix_user_id == bitrix_id)
    )
    user = result.scalar_one_or_none()

    if user:
        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive"
            )
        update_fields: dict = {"last_login": datetime.now(timezone.utc)}

        if first_name and user.first_name != first_name:
            update_fields["first_name"] = first_name
        if second_name and user.second_name != second_name:
            update_fields["second_name"] = second_name

        if bitrix_id in admin_ids and not user.is_admin:
            update_fields["is_admin"] = True

        user_update = UserUpdate(**update_fields)
        user = await user_manager.update(user_update, user, safe=True, request=request)
    else:
        try:
            user_by_email = await user_manager.get_by_email(email)
        except fastapi_users_exceptions.UserNotExists:
            user_by_email = None

        if user_by_email:
            if not user_by_email.is_active:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive"
                )
            if (
                user_by_email.bitrix_user_id
                and user_by_email.bitrix_user_id != bitrix_id
            ):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email is linked to another Bitrix user",
                )
            update_fields = {
                "bitrix_user_id": bitrix_id,
                "last_login": datetime.now(timezone.utc),
            }

            if first_name:
                update_fields["first_name"] = first_name
            if second_name:
                update_fields["second_name"] = second_name
            if bitrix_id in admin_ids and not user_by_email.is_admin:
                update_fields["is_admin"] = True
            user_update = UserUpdate(**update_fields)
            user = await user_manager.update(
                user_update, user_by_email, safe=True, request=request
            )
        else:
            user_create = UserCreate(
                email=email,
                password=uuid.uuid4().hex,
                is_active=True,
                bitrix_user_id=bitrix_id,
                is_admin=bitrix_id in admin_ids,
                first_name=first_name,
                second_name=second_name,
            )
            user = await user_manager.create(user_create, safe=True, request=request)

    await session.commit()

    token = await get_jwt_strategy().write_token(user)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserRead.model_validate(user),
    }
