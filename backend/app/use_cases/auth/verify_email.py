from app.domain.protocols.user_repo import UserRepo

class VerifyEmailUseCase:
    def __init__(self, user_repo: UserRepo):
        self.user_repo = user_repo

    def execute(self, email: str, code: str) -> None:
        # Validate active email verification OTP code
        active_otp = self.user_repo.get_active_otp(email, "email_verification", code)
        if not active_otp:
            raise ValueError("Invalid or expired verification code.")

        # Query user record and flag as verified
        user = self.user_repo.get_user_by_id(active_otp.user_id)
        if not user:
            raise ValueError("User account not found.")

        user.is_verified = True
        self.user_repo.update_user(user)

        # Invalidate the consumed OTP token
        self.user_repo.delete_otp_token(active_otp.token_id)
