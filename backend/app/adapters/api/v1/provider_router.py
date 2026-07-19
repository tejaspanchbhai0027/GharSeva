from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.adapters.api.dependencies import (
    get_provider_repository, get_user_repository, get_current_user, RoleChecker, get_review_repository
)
from app.adapters.database.provider_repository import ProviderRepository
from app.adapters.database.user_repository import UserRepository
from app.adapters.database.sqlalchemy_models import User
from app.domain.protocols.review_repo import ReviewRepository

from app.use_cases.provider.list_providers import ListProvidersUseCase
from app.use_cases.provider.get_provider_profile import GetProviderProfileUseCase
from app.use_cases.provider.update_provider_profile import UpdateProviderProfileUseCase
from app.use_cases.provider.manage_availability import ManageAvailabilityUseCase
from app.use_cases.provider.match_providers import MatchProvidersUseCase
from app.use_cases.review.list_provider_reviews import ListProviderReviewsUseCase

router = APIRouter()

# Pydantic validation schemas
class AvailabilitySlotInput(BaseModel):
    day_of_week: int = Field(..., ge=0, le=6, description="0=Sunday, 6=Saturday")
    start_time: str = Field(..., description="ISO time e.g. '09:00:00'")
    end_time: str = Field(..., description="ISO time e.g. '17:00:00'")
    is_blocked: bool = False

class ProviderProfileUpdate(BaseModel):
    bio: Optional[str] = None
    experience_years: Optional[int] = None
    is_available: Optional[bool] = None
    service_radius_km: Optional[int] = None
    bank_account_info: Optional[Dict[str, Any]] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    profile_photo_url: Optional[str] = None


@router.get("/")
async def get_providers(
    category_id: Optional[str] = None,
    experience_min: Optional[int] = None,
    rating_min: Optional[float] = None,
    search: Optional[str] = None,
    sort_by: str = "rating",
    sort_order: str = "desc",
    page: int = 1,
    limit: int = 10,
    provider_repo: ProviderRepository = Depends(get_provider_repository),
    user_repo: UserRepository = Depends(get_user_repository)
):
    use_case = ListProvidersUseCase(provider_repo, user_repo)
    return use_case.execute(
        category_id=category_id,
        experience_min=experience_min,
        rating_min=rating_min,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        page=page,
        limit=limit
    )

@router.get("/{id}/reviews")
async def get_provider_reviews(
    id: str,
    include_hidden: bool = False,
    review_repo: ReviewRepository = Depends(get_review_repository)
):
    use_case = ListProviderReviewsUseCase(review_repo)
    return use_case.execute(id, include_hidden=include_hidden)


@router.get("/match")
async def get_matches(
    service_id: str,
    scheduled_at: str,
    address_id: str,
    current_user: User = Depends(get_current_user),
    provider_repo: ProviderRepository = Depends(get_provider_repository),
    user_repo: UserRepository = Depends(get_user_repository)
):
    # Only customers or admins can fetch matched recommendations
    if current_user.role not in ["customer", "admin"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can request service provider matches."
        )

    use_case = MatchProvidersUseCase(provider_repo, user_repo)
    try:
        return use_case.execute(
            service_id=service_id,
            scheduled_at=scheduled_at,
            address_id=address_id
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{id}")
async def get_provider(
    id: str,
    provider_repo: ProviderRepository = Depends(get_provider_repository),
    user_repo: UserRepository = Depends(get_user_repository)
):
    use_case = GetProviderProfileUseCase(provider_repo, user_repo)
    try:
        return use_case.execute(provider_id=id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))

@router.get("/{id}/services")
async def get_provider_services(
    id: str,
    provider_repo: ProviderRepository = Depends(get_provider_repository)
):
    from uuid import UUID
    try:
        services = provider_repo.get_provider_services(UUID(id))
        return [
            {
                "service_id": str(s.service_id),
                "category_id": str(s.category_id),
                "name": s.name,
                "description": s.description,
                "base_price": float(s.base_price),
                "price_type": s.price_type
            } for s in services
        ]
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.put("/{id}")
async def update_provider_profile(
    id: str,
    payload: ProviderProfileUpdate,
    current_user: User = Depends(get_current_user),
    provider_repo: ProviderRepository = Depends(get_provider_repository),
    user_repo: UserRepository = Depends(get_user_repository)
):
    # Retrieve provider detail
    provider = provider_repo.get_provider_by_id(id)
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service provider profile not found.")

    # Owner checking authorization or admin
    if current_user.role != "admin" and provider.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to update this service provider profile."
        )

    use_case = UpdateProviderProfileUseCase(provider_repo, user_repo)
    try:
        return use_case.execute(
            provider_id=id,
            bio=payload.bio,
            experience_years=payload.experience_years,
            is_available=payload.is_available,
            service_radius_km=payload.service_radius_km,
            bank_account_info=payload.bank_account_info,
            full_name=payload.full_name,
            phone=payload.phone,
            profile_photo_url=payload.profile_photo_url
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{id}/availability")
async def get_provider_availability(
    id: str,
    provider_repo: ProviderRepository = Depends(get_provider_repository)
):
    use_case = ManageAvailabilityUseCase(provider_repo)
    try:
        return use_case.get_availability(provider_id=id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.post("/{id}/availability")
async def set_provider_availability(
    id: str,
    slots: List[AvailabilitySlotInput],
    current_user: User = Depends(get_current_user),
    provider_repo: ProviderRepository = Depends(get_provider_repository)
):
    provider = provider_repo.get_provider_by_id(id)
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Service provider profile not found.")

    # Owner checking authorization or admin
    if current_user.role != "admin" and provider.user_id != current_user.user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to set availability for this provider."
        )

    use_case = ManageAvailabilityUseCase(provider_repo)
    try:
        slots_data = [slot.dict() for slot in slots]
        return use_case.set_availability(provider_id=id, slots_data=slots_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
