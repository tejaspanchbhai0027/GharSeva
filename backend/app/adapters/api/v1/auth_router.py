import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, Request, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr

from app.adapters.api.dependencies import get_user_repository
from app.adapters.database.user_repository import UserRepository
from app.use_cases.auth.register import RegisterUseCase
from app.use_cases.auth.verify_email import VerifyEmailUseCase
from app.use_cases.auth.login import LoginUseCase
from app.use_cases.auth.refresh_token import RefreshTokenUseCase
from app.use_cases.auth.reset_password import ResetPasswordUseCase
from app.adapters.api.dependencies import get_current_user
from app.adapters.database.sqlalchemy_models import User

router = APIRouter()
logger = logging.getLogger("auth_router")

# Pydantic Schemas
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    phone: Optional[str] = None
    role: str

class VerifyEmail(BaseModel):
    email: EmailStr
    code: str

class UserLoginJSON(BaseModel):
    email: EmailStr
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPassword(BaseModel):
    email: EmailStr
    otp_code: str
    new_password: str

class UserResponse(BaseModel):
    user_id: str
    email: str
    full_name: str
    role: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(
    user_data: UserRegister,
    user_repo: UserRepository = Depends(get_user_repository)
):
    use_case = RegisterUseCase(user_repo)
    try:
        user, otp_code = use_case.execute(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            phone=user_data.phone,
            role=user_data.role
        )
        # Mock Notification Delivery Mechanism: print/log to standard output
        print(f"\n==================================================")
        print(f"[NOTIFICATION MOCK] EMAIL OTP FOR {user.email}: {otp_code}")
        print(f"==================================================\n")
        
        return {
            "message": "Verification OTP sent.",
            "email": user.email
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/verify-email")
async def verify_email(
    payload: VerifyEmail,
    user_repo: UserRepository = Depends(get_user_repository)
):
    use_case = VerifyEmailUseCase(user_repo)
    try:
        use_case.execute(email=payload.email, code=payload.code)
        return {"message": "Email verified successfully. You can now login."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/login", response_model=LoginResponse)
async def login(
    response: Response,
    json_data: UserLoginJSON,
    user_repo: UserRepository = Depends(get_user_repository)
):
    # Accept JSON body login credentials
    email = json_data.email
    password = json_data.password

    use_case = LoginUseCase(user_repo)
    try:
        access_token, refresh_token, user = use_case.execute(email=email, password=password)
        
        # Set HTTPOnly secure cookie for JWT refresh token
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=True,
            samesite="lax",
            max_age=7 * 24 * 60 * 60  # 7 days
        )

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "user_id": str(user.user_id),
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role
            }
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except PermissionError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))


@router.post("/logout")
async def logout(response: Response):
    # Delete refresh token cookie
    response.delete_cookie("refresh_token")
    return {"message": "Logged out successfully"}


@router.post("/refresh")
async def refresh(
    request: Request,
    user_repo: UserRepository = Depends(get_user_repository)
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token cookie missing."
        )

    use_case = RefreshTokenUseCase(user_repo)
    try:
        new_access_token = use_case.execute(refresh_token)
        return {
            "access_token": new_access_token,
            "token_type": "bearer"
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(e))


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    user_repo: UserRepository = Depends(get_user_repository)
):
    use_case = ResetPasswordUseCase(user_repo)
    try:
        otp_code = use_case.request_reset_code(payload.email)
        # Mock Notification Delivery Mechanism: print/log to standard output
        print(f"\n==================================================")
        print(f"[NOTIFICATION MOCK] PASSWORD RESET OTP FOR {payload.email}: {otp_code}")
        print(f"==================================================\n")
        
        return {"message": "Reset code sent to email."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/reset-password")
async def reset_password_confirm(
    payload: ResetPassword,
    user_repo: UserRepository = Depends(get_user_repository)
):
    use_case = ResetPasswordUseCase(user_repo)
    try:
        use_case.reset_password(
            email=payload.email,
            otp_code=payload.otp_code,
            new_password=payload.new_password
        )
        return {"message": "Password updated successfully."}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/me", response_model=UserResponse)
async def read_me(current_user: User = Depends(get_current_user)):
    return {
        "user_id": str(current_user.user_id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role
    }

from app.use_cases.user.address_management import AddressManagementUseCase, CreateAddressInput

@router.get("/me/addresses")
async def get_my_addresses(
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
):
    use_case = AddressManagementUseCase(user_repo)
    return use_case.list_addresses(user_id=str(current_user.user_id))

@router.post("/me/addresses", status_code=status.HTTP_201_CREATED)
async def add_my_address(
    address_data: CreateAddressInput,
    current_user: User = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
):
    use_case = AddressManagementUseCase(user_repo)
    addr = use_case.add_address(user_id=str(current_user.user_id), input_data=address_data)
    
    coord_dict = None
    if addr.coordinates:
        coord_dict = {"lat": addr.coordinates[1], "lng": addr.coordinates[0]}
        
    return {
        "address_id": str(addr.address_id),
        "title": addr.title,
        "address_text": addr.address_text,
        "coordinates": coord_dict,
        "created_at": addr.created_at.isoformat()
    }
