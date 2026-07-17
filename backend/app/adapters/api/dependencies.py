from typing import List
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import ALGORITHM
from app.adapters.database.sqlalchemy_models import User
from app.adapters.database.user_repository import UserRepository
from app.adapters.database.provider_repository import ProviderRepository
from app.adapters.database.service_repository import SQLAlchemyServiceRepository
from app.domain.protocols.service_repo import ServiceRepository
from app.adapters.database.booking_repository import SQLAlchemyBookingRepository
from app.domain.protocols.booking_repo import BookingRepository

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_user_repository(db: Session = Depends(get_db)) -> UserRepository:
    return UserRepository(db)

def get_provider_repository(db: Session = Depends(get_db)) -> ProviderRepository:
    return ProviderRepository(db)

def get_service_repository(db: Session = Depends(get_db)) -> ServiceRepository:
    return SQLAlchemyServiceRepository(db)

def get_booking_repository(db: Session = Depends(get_db)) -> BookingRepository:
    return SQLAlchemyBookingRepository(db)

def get_current_user(
    token: str = Depends(oauth2_scheme),
    user_repo: UserRepository = Depends(get_user_repository)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode access token subject
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        token_type: str = payload.get("type")
        if user_id_str is None or token_type != "access":
            raise credentials_exception
        user_id = UUID(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    user = user_repo.get_user_by_id(user_id)
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is suspended"
        )
    return user

class RoleChecker:
    def __init__(self, allowed_roles: List[str]):
        self.allowed_roles = allowed_roles

    def __call__(self, current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to access this resource"
            )
        return current_user
