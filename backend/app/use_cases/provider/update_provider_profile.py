from typing import Dict, Any, Optional
from uuid import UUID
from app.domain.protocols.provider_repo import ProviderRepo
from app.domain.protocols.user_repo import UserRepo

class UpdateProviderProfileUseCase:
    def __init__(self, provider_repo: ProviderRepo, user_repo: UserRepo):
        self.provider_repo = provider_repo
        self.user_repo = user_repo

    def execute(
        self,
        provider_id: str,
        bio: Optional[str] = None,
        experience_years: Optional[int] = None,
        is_available: Optional[bool] = None,
        service_radius_km: Optional[int] = None,
        bank_account_info: Optional[Dict[str, Any]] = None,
        full_name: Optional[str] = None,
        phone: Optional[str] = None,
        profile_photo_url: Optional[str] = None
    ) -> Dict[str, Any]:
        provider = self.provider_repo.get_provider_by_id(UUID(provider_id))
        if not provider:
            raise ValueError("Service provider profile not found.")

        user = self.user_repo.get_user_by_id(provider.user_id)
        if not user or not user.is_active:
            raise ValueError("User account associated with this provider is inactive or not found.")

        # Update provider model fields
        if bio is not None:
            provider.bio = bio
        if experience_years is not None:
            provider.experience_years = experience_years
        if is_available is not None:
            provider.is_available = is_available
        if service_radius_km is not None:
            provider.service_radius_km = service_radius_km
        if bank_account_info is not None:
            provider.bank_account_info = bank_account_info

        self.provider_repo.update_provider_profile(provider)

        # Update user model fields
        updated_user = False
        if full_name is not None:
            user.full_name = full_name
            updated_user = True
        if phone is not None:
            user.phone = phone
            updated_user = True
        if profile_photo_url is not None:
            user.profile_photo_url = profile_photo_url
            updated_user = True

        if updated_user:
            self.user_repo.update_user(user)

        return {
            "provider_id": str(provider.provider_id),
            "user_id": str(provider.user_id),
            "full_name": user.full_name,
            "email": user.email,
            "phone": user.phone,
            "profile_photo_url": user.profile_photo_url,
            "bio": provider.bio,
            "experience_years": provider.experience_years,
            "avg_rating": float(provider.avg_rating),
            "total_jobs": provider.total_jobs,
            "is_available": provider.is_available,
            "service_radius_km": provider.service_radius_km,
            "verification_status": provider.verification_status,
            "bank_account_info": provider.bank_account_info
        }
