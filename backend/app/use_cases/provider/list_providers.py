from typing import Optional, List, Dict, Any
from uuid import UUID
from app.domain.protocols.provider_repo import ProviderRepo
from app.domain.protocols.user_repo import UserRepo

class ListProvidersUseCase:
    def __init__(self, provider_repo: ProviderRepo, user_repo: UserRepo):
        self.provider_repo = provider_repo
        self.user_repo = user_repo

    def execute(
        self,
        category_id: Optional[str] = None,
        experience_min: Optional[int] = None,
        rating_min: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        category_uuid = UUID(category_id) if category_id else None

        providers = self.provider_repo.list_providers(
            category_id=category_uuid,
            experience_min=experience_min,
            rating_min=rating_min
        )

        results = []
        for provider in providers:
            user = self.user_repo.get_user_by_id(provider.user_id)
            if user and user.is_active:
                results.append({
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
                    "verification_status": provider.verification_status
                })
        return results
