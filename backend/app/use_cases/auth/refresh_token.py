from uuid import UUID
from jose import jwt, JWTError
from app.domain.protocols.user_repo import UserRepo
from app.core.security import ALGORITHM, create_access_token
from app.core.config import settings

class RefreshTokenUseCase:
    def __init__(self, user_repo: UserRepo):
        self.user_repo = user_repo

    def execute(self, refresh_token: str) -> str:
        try:
            # Decode token properties
            payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            token_type = payload.get("type")
            if token_type != "refresh":
                raise ValueError("Invalid token type.")
            
            user_id_str = payload.get("sub")
            if not user_id_str:
                raise ValueError("Subject not found in token.")
            
            user_id = UUID(user_id_str)
        except (JWTError, ValueError) as e:
            raise ValueError("Invalid refresh token.") from e

        # Query user record validation
        user = self.user_repo.get_user_by_id(user_id)
        if not user or not user.is_active:
            raise ValueError("User account is inactive or not found.")

        # Re-issue access token
        new_access_token = create_access_token(subject=user.user_id)
        return new_access_token
