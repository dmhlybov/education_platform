import enum

from pydantic import BaseModel, EmailStr, Field, RootModel
from typing import List, Optional
from fastapi_users import schemas
from datetime import datetime


class UserType(str, enum.Enum):
    employee = "employee"
    client = "client"


class UserContext(BaseModel):
    id: int
    email: EmailStr | None = None
    is_admin: bool = False
    is_active: bool
    is_verified: bool


class UserRead(schemas.BaseUser[int]):
    username: Optional[str] = None
    first_name: str
    second_name: str
    is_admin: bool = False
    last_login: Optional[datetime] = None
    bitrix_user_id: Optional[str] = None


class LinkBitrixRequest(BaseModel):
    bitrix_user_id: str | None = None


class UserCreate(schemas.BaseUserCreate):
    first_name: str | None = None
    second_name: str | None = None
    username: Optional[str] = None

    bitrix_user_id: str | None = None
    is_admin: bool = False

    class Config:
        from_attributes = True


class UserUpdate(schemas.BaseUserUpdate):
    bitrix_user_id: str | None = None
    is_admin: bool | None = None
    first_name: str | None = None
    second_name: str | None = None
    last_login: datetime | None = None


class CustomUserUpdate(schemas.BaseUserUpdate):
    first_name: str
    second_name: str


class ChangeUserPassword(BaseModel):
    new_password: str = Field(..., min_length=8)


class PermissionsSchema(BaseModel):
    clients: List[int]
    projects: List[int]
    querys: List[int]

    class Config:
        from_attributes = True


class FunctionsSchema(RootModel):
    root: List[str]
