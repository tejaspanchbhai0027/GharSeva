from abc import ABC, abstractmethod
from typing import Optional, Any
from uuid import UUID
from app.adapters.database.sqlalchemy_models import User, OTPToken, ServiceProvider

class UserRepo(ABC):
    @abstractmethod
    def get_user_by_email(self, email: str) -> Optional[User]:
        pass

    @abstractmethod
    def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        pass

    @abstractmethod
    def create_user(self, user: User) -> User:
        pass

    @abstractmethod
    def update_user(self, user: User) -> User:
        pass

    @abstractmethod
    def create_otp_token(self, otp: OTPToken) -> OTPToken:
        pass

    @abstractmethod
    def get_active_otp(self, email: str, purpose: str, code: str) -> Optional[OTPToken]:
        pass

    @abstractmethod
    def delete_otp_token(self, token_id: UUID) -> None:
        pass

    @abstractmethod
    def create_provider_profile(self, provider: ServiceProvider) -> ServiceProvider:
        pass
