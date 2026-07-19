from typing import List, Dict, Any
from app.domain.protocols.review_repo import ReviewRepository
from app.adapters.database.sqlalchemy_models import User

class ListAllReviewsUseCase:
    def __init__(self, review_repo: ReviewRepository):
        self.review_repo = review_repo

    def execute(self, current_user: User) -> List[Dict[str, Any]]:
        if current_user.role != "admin":
            raise ValueError("Only admins can list all reviews.")
            
        reviews = self.review_repo.get_all_reviews()
        
        result = []
        for r in reviews:
            result.append({
                "review_id": str(r.review_id),
                "booking_id": str(r.booking_id),
                "customer_id": str(r.customer_id),
                "provider_id": str(r.provider_id),
                "rating": r.rating,
                "comment": r.comment,
                "reply": r.reply,
                "is_hidden": r.is_hidden,
                "created_at": r.created_at.isoformat()
            })
        return result
