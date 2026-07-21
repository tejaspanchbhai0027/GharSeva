from pydantic import BaseModel, Field, conint
from typing import Dict, Any
from uuid import UUID

from app.domain.protocols.review_repo import ReviewRepository
from app.domain.protocols.booking_repo import BookingRepository
from app.domain.protocols.provider_repo import ProviderRepo as ProviderRepository
from app.adapters.database.sqlalchemy_models import Review, User

class SubmitReviewInput(BaseModel):
    booking_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: str = Field(None)

class SubmitReviewUseCase:
    def __init__(
        self,
        review_repo: ReviewRepository,
        booking_repo: BookingRepository,
        provider_repo: ProviderRepository
    ):
        self.review_repo = review_repo
        self.booking_repo = booking_repo
        self.provider_repo = provider_repo

    def execute(self, current_user: User, input_data: SubmitReviewInput) -> Dict[str, Any]:
        # Validate booking
        booking = self.booking_repo.get_booking_by_id(UUID(input_data.booking_id))
        if not booking:
            raise ValueError("Booking not found.")
        
        if booking.customer_id != current_user.user_id:
            raise ValueError("You can only review your own bookings.")
            
        if booking.status != "completed":
            raise ValueError("You can only review completed bookings.")
            
        # Check if already reviewed
        existing_review = self.review_repo.get_review_by_booking_id(booking.booking_id)
        if existing_review:
            raise ValueError("A review already exists for this booking.")
            
        # Create review
        new_review = Review(
            booking_id=booking.booking_id,
            customer_id=current_user.user_id,
            provider_id=booking.provider_id,
            rating=input_data.rating,
            comment=input_data.comment
        )
        
        created_review = self.review_repo.create_review(new_review)
        
        # Recalculate provider rating
        # Simple recalculation logic
        provider = self.provider_repo.get_provider_by_id(booking.provider_id)
        if provider:
            # We fetch all reviews to calc avg, or just keep a running tally. Let's fetch all non-hidden.
            all_reviews = self.review_repo.get_provider_reviews(provider.provider_id, include_hidden=False)
            total_rating = sum(r.rating for r in all_reviews)
            count = len(all_reviews)
            
            provider.avg_rating = total_rating / count if count > 0 else 0
            # Note: total_jobs might have been incremented at booking completion, we just touch avg_rating
            self.provider_repo.update_provider_profile(provider)
            
        return {
            "review_id": str(created_review.review_id),
            "booking_id": str(created_review.booking_id),
            "provider_id": str(created_review.provider_id),
            "rating": created_review.rating,
            "comment": created_review.comment,
            "created_at": created_review.created_at.isoformat()
        }
