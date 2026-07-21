from datetime import datetime, timezone
from typing import Optional, List, Any
from uuid import UUID
from sqlalchemy.orm import Session
from app.domain.protocols.user_repo import UserRepo
from app.adapters.database.sqlalchemy_models import User, OTPToken, ServiceProvider

class UserRepository(UserRepo):
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_user_by_id(self, user_id: UUID) -> Optional[User]:
        return self.db.query(User).filter(User.user_id == user_id).first()

    def create_user(self, user: User) -> User:
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    def update_user(self, user: User) -> User:
        self.db.commit()
        self.db.refresh(user)
        return user

    def create_otp_token(self, otp: OTPToken) -> OTPToken:
        self.db.add(otp)
        self.db.commit()
        self.db.refresh(otp)
        return otp

    def get_active_otp(self, email: str, purpose: str, code: str) -> Optional[OTPToken]:
        # Perform join between OTPToken and User tables to search by user email
        now = datetime.now(timezone.utc)
        return self.db.query(OTPToken).join(User).filter(
            User.email == email,
            OTPToken.purpose == purpose,
            OTPToken.otp_code == code,
            OTPToken.expires_at > now
        ).first()

    def delete_otp_token(self, token_id: UUID) -> None:
        otp = self.db.query(OTPToken).filter(OTPToken.token_id == token_id).first()
        if otp:
            self.db.delete(otp)
            self.db.commit()

    def create_provider_profile(self, provider: ServiceProvider) -> ServiceProvider:
        self.db.add(provider)
        self.db.commit()
        self.db.refresh(provider)
        return provider

    def get_addresses_by_user_id(self, user_id: UUID) -> list:
        from app.adapters.database.sqlalchemy_models import Address
        return self.db.query(Address).filter(Address.user_id == user_id).order_by(Address.created_at.desc()).all()

    def create_address(self, address: Any) -> Any:
        self.db.add(address)
        self.db.commit()
        self.db.refresh(address)
        return address

    def list_users(
        self,
        search: Optional[str] = None,
        role: Optional[str] = None,
        is_active: Optional[bool] = None,
        limit: int = 20,
        offset: int = 0
    ) -> tuple[List[User], int]:
        query = self.db.query(User)

        if search:
            query = query.filter(User.full_name.ilike(f"%{search}%") | User.email.ilike(f"%{search}%"))
        
        if role:
            query = query.filter(User.role == role)
            
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
            
        total = query.count()
        users = query.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
        return users, total
