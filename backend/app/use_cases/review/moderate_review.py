from pydantic import BaseModel
from typing import Dict, Any
from uuid import UUID

from app.domain.protocols.review_repo import ReviewRepository
from app.domain.protocols.provider_repo import ProviderRepository
from app.adapters.database.sqlalchemy_models import User

class ModerateReviewInput(BaseModel):
    is_hidden: bool

class ModerateReviewUseCase:
    def __init__(self, review_repo: ReviewRepository, provider_repo: ProviderRepository):
        self.review_repo = review_repo
        self.provider_repo = provider_repo

    def execute(self, review_id: str, current_user: User, input_data: ModerateReviewInput) -> Dict[str, Any]:
        if current_user.role != "admin":
            raise ValueError("Only admins can moderate reviews.")
            
        review = self.review_repo.get_review_by_id(UUID(review_id))
        if not review:
            raise ValueError("Review not found.")
            
        review.is_hidden = input_data.is_hidden
        updated_review = self.review_repo.update_review(review)
        
        # Recalculate provider rating because we hid/unhid a review
        provider = self.provider_repo.get_provider_by_id(review.provider_id)
        if provider:
            all_reviews = self.review_repo.get_provider_reviews(provider.provider_id, include_hidden=False)
            total_rating = sum(r.rating for r in all_reviews)
            count = len(all_reviews)
            
            provider.avg_rating = total_rating / count if count > 0 else 0
            self.provider_repo.update_provider_profile(provider)
        
        return {
            "review_id": str(updated_review.review_id),
            "booking_id": str(updated_review.booking_id),
            "provider_id": str(updated_review.provider_id),
            "rating": updated_review.rating,
            "comment": updated_review.comment,
            "reply": updated_review.reply,
            "is_hidden": updated_review.is_hidden,
            "created_at": updated_review.created_at.isoformat()
        }
