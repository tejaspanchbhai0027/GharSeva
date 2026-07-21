from pydantic import BaseModel, Field
from typing import Dict, Any
from uuid import UUID

from app.domain.protocols.review_repo import ReviewRepository
from app.domain.protocols.provider_repo import ProviderRepo as ProviderRepository
from app.adapters.database.sqlalchemy_models import User

class ReplyReviewInput(BaseModel):
    reply: str = Field(..., min_length=1)

class ReplyToReviewUseCase:
    def __init__(self, review_repo: ReviewRepository, provider_repo: ProviderRepository):
        self.review_repo = review_repo
        self.provider_repo = provider_repo

    def execute(self, review_id: str, current_user: User, input_data: ReplyReviewInput) -> Dict[str, Any]:
        review = self.review_repo.get_review_by_id(UUID(review_id))
        if not review:
            raise ValueError("Review not found.")
            
        provider = self.provider_repo.get_provider_by_user_id(current_user.user_id)
        if not provider or provider.provider_id != review.provider_id:
            raise ValueError("You can only reply to your own reviews.")
            
        review.reply = input_data.reply
        updated_review = self.review_repo.update_review(review)
        
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
