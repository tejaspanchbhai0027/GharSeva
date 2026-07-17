import pytest
from unittest.mock import MagicMock
from datetime import datetime, timedelta, timezone

from app.domain.protocols.user_repo import UserRepo
from app.adapters.database.sqlalchemy_models import User, OTPToken
from app.use_cases.auth.register import RegisterUseCase
from app.use_cases.auth.verify_email import VerifyEmailUseCase
from app.use_cases.auth.login import LoginUseCase
from app.use_cases.auth.refresh_token import RefreshTokenUseCase
from app.use_cases.auth.reset_password import ResetPasswordUseCase

@pytest.fixture
def mock_user_repo():
    return MagicMock(spec=UserRepo)

def test_register_use_case_success(mock_user_repo):
    # Setup mock returns
    mock_user_repo.get_user_by_email.return_value = None
    mock_user_repo.create_user.side_effect = lambda u: u  # return the same user object

    use_case = RegisterUseCase(mock_user_repo)
    user, otp_code = use_case.execute(
        email="test@user.com",
        password="test_password",
        full_name="Test User",
        phone="1234567890",
        role="customer"
    )

    assert user.email == "test@user.com"
    assert user.is_verified is False
    assert user.role == "customer"
    assert len(otp_code) == 6
    mock_user_repo.create_user.assert_called_once()
    mock_user_repo.create_otp_token.assert_called_once()

def test_register_use_case_duplicate_email(mock_user_repo):
    # Mock pre-existing user
    mock_user_repo.get_user_by_email.return_value = User(email="test@user.com")

    use_case = RegisterUseCase(mock_user_repo)
    with pytest.raises(ValueError, match="Email address already registered."):
        use_case.execute(
            email="test@user.com",
            password="test_password",
            full_name="Test User",
            phone="1234567890",
            role="customer"
        )

def test_verify_email_use_case_success(mock_user_repo):
    # Mock user and active OTP
    user = User(email="test@user.com", is_verified=False)
    user.user_id = "test-uuid"
    otp = OTPToken(user_id=user.user_id, otp_code="123456")
    otp.token_id = "token-uuid"

    mock_user_repo.get_active_otp.return_value = otp
    mock_user_repo.get_user_by_id.return_value = user

    use_case = VerifyEmailUseCase(mock_user_repo)
    use_case.execute(email="test@user.com", code="123456")

    assert user.is_verified is True
    mock_user_repo.update_user.assert_called_once_with(user)
    mock_user_repo.delete_otp_token.assert_called_once_with("token-uuid")

def test_verify_email_invalid_code(mock_user_repo):
    # Mock no active OTP found
    mock_user_repo.get_active_otp.return_value = None

    use_case = VerifyEmailUseCase(mock_user_repo)
    with pytest.raises(ValueError, match="Invalid or expired verification code."):
        use_case.execute(email="test@user.com", code="000000")

def test_login_use_case_success(mock_user_repo):
    # Mock active, verified user
    from app.core.security import get_password_hash
    hashed_pwd = get_password_hash("my_secret_pwd")
    user = User(email="test@user.com", password_hash=hashed_pwd, is_verified=True, is_active=True)
    user.user_id = "test-uuid"
    mock_user_repo.get_user_by_email.return_value = user

    use_case = LoginUseCase(mock_user_repo)
    access_token, refresh_token, logged_user = use_case.execute(
        email="test@user.com",
        password="my_secret_pwd"
    )

    assert logged_user.email == "test@user.com"
    assert access_token is not None
    assert refresh_token is not None

def test_login_use_case_unverified(mock_user_repo):
    from app.core.security import get_password_hash
    hashed_pwd = get_password_hash("my_secret_pwd")
    user = User(email="test@user.com", password_hash=hashed_pwd, is_verified=False, is_active=True)
    mock_user_repo.get_user_by_email.return_value = user

    use_case = LoginUseCase(mock_user_repo)
    with pytest.raises(PermissionError, match="Account email verification is pending."):
        use_case.execute(email="test@user.com", password="my_secret_pwd")

def test_reset_password_success(mock_user_repo):
    # Mock active OTP and user
    user = User(email="test@user.com", password_hash="old_hash")
    user.user_id = "test-uuid"
    otp = OTPToken(user_id=user.user_id, otp_code="654321")
    otp.token_id = "token-uuid"

    mock_user_repo.get_active_otp.return_value = otp
    mock_user_repo.get_user_by_id.return_value = user

    use_case = ResetPasswordUseCase(mock_user_repo)
    use_case.reset_password(email="test@user.com", otp_code="654321", new_password="new_super_secret")

    assert user.password_hash != "old_hash"
    mock_user_repo.update_user.assert_called_once_with(user)
    mock_user_repo.delete_otp_token.assert_called_once_with("token-uuid")
