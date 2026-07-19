from typing import Dict, Any, Optional
from uuid import UUID

from app.domain.protocols.review_repo import ReviewRepository
from app.adapters.database.sqlalchemy_models import User

class GetBookingReviewUseCase:
    def __init__(self, review_repo: ReviewRepository):
        self.review_repo = review_repo

    def execute(self, booking_id: str, current_user: User) -> Optional[Dict[str, Any]]:
        # In a real app we might verify if current_user has access to the booking. 
        # For simplicity, we just fetch the review.
        review = self.review_repo.get_review_by_booking_id(UUID(booking_id))
        
        if not review:
            return None
            
        return {
            "review_id": str(review.review_id),
            "booking_id": str(review.booking_id),
            "customer_id": str(review.customer_id),
            "provider_id": str(review.provider_id),
            "rating": review.rating,
            "comment": review.comment,
            "reply": review.reply,
            "is_hidden": review.is_hidden,
            "created_at": review.created_at.isoformat()
        }
