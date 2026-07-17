import random
from datetime import datetime, timedelta, timezone
from app.domain.protocols.user_repo import UserRepo
from app.adapters.database.sqlalchemy_models import User, OTPToken, ServiceProvider
from app.core.security import get_password_hash

class RegisterUseCase:
    def __init__(self, user_repo: UserRepo):
        self.user_repo = user_repo

    def execute(self, email: str, password: str, full_name: str, phone: str, role: str) -> tuple[User, str]:
        # Validate that the role is valid
        if role not in ["customer", "provider", "admin", "support"]:
            raise ValueError("Invalid user role specified.")

        # Check if email is unique
        existing_user = self.user_repo.get_user_by_email(email)
        if existing_user:
            raise ValueError("Email address already registered.")

        # Hash password and instantiate User
        hashed_password = get_password_hash(password)
        new_user = User(
            email=email,
            password_hash=hashed_password,
            full_name=full_name,
            phone=phone,
            role=role,
            is_verified=False,
            is_active=True
        )
        created_user = self.user_repo.create_user(new_user)

        # If role is provider, initialize an empty ServiceProvider profile in a pending state
        if role == "provider":
            provider_profile = ServiceProvider(
                user_id=created_user.user_id,
                experience_years=0,
                avg_rating=0.00,
                total_jobs=0,
                is_available=True,
                service_radius_km=10,
                verification_status="pending"
            )
            self.user_repo.create_provider_profile(provider_profile)

        # Generate a 6-digit numerical OTP code
        otp_code = f"{random.randint(100000, 999999)}"
        expiry = datetime.now(timezone.utc) + timedelta(minutes=10)

        otp_token = OTPToken(
            user_id=created_user.user_id,
            otp_code=otp_code,
            purpose="email_verification",
            expires_at=expiry
        )
        self.user_repo.create_otp_token(otp_token)

        return created_user, otp_code
