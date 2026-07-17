import random
from datetime import datetime, timedelta, timezone
from app.domain.protocols.user_repo import UserRepo
from app.adapters.database.sqlalchemy_models import OTPToken
from app.core.security import get_password_hash

class ResetPasswordUseCase:
    def __init__(self, user_repo: UserRepo):
        self.user_repo = user_repo

    def request_reset_code(self, email: str) -> str:
        # Query user record
        user = self.user_repo.get_user_by_email(email)
        if not user:
            raise ValueError("No user account registered with this email.")

        # Generate a 6-digit reset OTP code
        otp_code = f"{random.randint(100000, 999999)}"
        expiry = datetime.now(timezone.utc) + timedelta(minutes=10)

        otp_token = OTPToken(
            user_id=user.user_id,
            otp_code=otp_code,
            purpose="password_reset",
            expires_at=expiry
        )
        self.user_repo.create_otp_token(otp_token)

        return otp_code

    def reset_password(self, email: str, otp_code: str, new_password: str) -> None:
        # Validate reset OTP code
        active_otp = self.user_repo.get_active_otp(email, "password_reset", otp_code)
        if not active_otp:
            raise ValueError("Invalid or expired reset code.")

        # Retrieve user and update
        user = self.user_repo.get_user_by_id(active_otp.user_id)
        if not user:
            raise ValueError("User account not found.")

        # Hash and set new password
        user.password_hash = get_password_hash(new_password)
        self.user_repo.update_user(user)

        # Invalidate the consumed OTP token
        self.user_repo.delete_otp_token(active_otp.token_id)
