from app.domain.protocols.user_repo import UserRepo
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.adapters.database.sqlalchemy_models import User

class LoginUseCase:
    def __init__(self, user_repo: UserRepo):
        self.user_repo = user_repo

    def execute(self, email: str, password: str) -> tuple[str, str, User]:
        # Retrieve user record
        user = self.user_repo.get_user_by_email(email)
        if not user:
            raise ValueError("Invalid email or password.")

        # Verify hashed password
        if not verify_password(password, user.password_hash):
            raise ValueError("Invalid email or password.")

        # Verify email status
        if not user.is_verified:
            raise PermissionError("Account email verification is pending.")

        # Generate tokens
        access_token = create_access_token(subject=user.user_id)
        refresh_token = create_refresh_token(subject=user.user_id)

        return access_token, refresh_token, user
