from typing import List, Dict, Any
from uuid import UUID

from app.domain.protocols.review_repo import ReviewRepository

class ListProviderReviewsUseCase:
    def __init__(self, review_repo: ReviewRepository):
        self.review_repo = review_repo

    def execute(self, provider_id: str, include_hidden: bool = False) -> List[Dict[str, Any]]:
        reviews = self.review_repo.get_provider_reviews(UUID(provider_id), include_hidden=include_hidden)
        
        result = []
        for r in reviews:
            # We don't have user relations mapped directly here in the simple setup, 
            # but usually we would return customer name as well.
            # In a real app we'd join with the User table.
            result.append({
                "review_id": str(r.review_id),
                "booking_id": str(r.booking_id),
                "customer_id": str(r.customer_id),
                "rating": r.rating,
                "comment": r.comment,
                "reply": r.reply,
                "is_hidden": r.is_hidden,
                "created_at": r.created_at.isoformat()
            })
        return result
