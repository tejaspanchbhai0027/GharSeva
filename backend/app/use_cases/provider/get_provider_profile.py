from typing import Dict, Any, Optional
from uuid import UUID
from app.domain.protocols.provider_repo import ProviderRepo
from app.domain.protocols.user_repo import UserRepo

class GetProviderProfileUseCase:
    def __init__(self, provider_repo: ProviderRepo, user_repo: UserRepo):
        self.provider_repo = provider_repo
        self.user_repo = user_repo

    def execute(
        self,
        provider_id: Optional[str] = None,
        user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        provider = None
        if provider_id:
            provider = self.provider_repo.get_provider_by_id(UUID(provider_id))
        elif user_id:
            provider = self.provider_repo.get_provider_by_user_id(UUID(user_id))

        if not provider:
            raise ValueError("Service provider profile not found.")

        user = self.user_repo.get_user_by_id(provider.user_id)
        if not user or not user.is_active:
            raise ValueError("User account associated with this provider is inactive or not found.")

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
    def execute_raw(self, provider_id: str):
        provider = self.provider_repo.get_provider_by_id(UUID(provider_id))
        if not provider:
             raise ValueError("Service provider profile not found.")
        return provider
