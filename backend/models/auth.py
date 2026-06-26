from sqlalchemy import (
    Column,
    func,
    DateTime,
    Integer,
    String,
    Boolean,
)

from typing import TYPE_CHECKING

from sqlalchemy.orm import Mapped, relationship

from backend.database import Base

if TYPE_CHECKING:
    from backend.models.learn import Attempt, CourseAssignment


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, unique=True, autoincrement=True, primary_key=True, index=True)
    first_name = Column(String, nullable=False)
    second_name = Column(String, nullable=False)
    email = Column(String, nullable=False)
    date_registration = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    username = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    is_verified = Column(Boolean, default=False)
    last_login = Column(
        DateTime(timezone=True), server_default=func.now(), nullable=True
    )

    bitrix_user_id = Column(String, nullable=True, unique=True)

    @property
    def is_superuser(self) -> bool:
        return bool(self.is_admin)

    @is_superuser.setter
    def is_superuser(self, value: bool) -> None:
        self.is_admin = value

    attempts: Mapped[list["Attempt"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
    assignments: Mapped[list["CourseAssignment"]] = relationship(
        back_populates="user", cascade="all, delete-orphan"
    )
