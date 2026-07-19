from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.domain.protocols.review_repo import ReviewRepository
from app.adapters.database.sqlalchemy_models import Review

class SQLAlchemyReviewRepository(ReviewRepository):
    def __init__(self, session: Session):
        self.session = session

    def create_review(self, review: Review) -> Review:
        self.session.add(review)
        self.session.commit()
        self.session.refresh(review)
        return review

    def get_review_by_id(self, review_id: UUID) -> Optional[Review]:
        return self.session.query(Review).filter(Review.review_id == review_id).first()

    def get_review_by_booking_id(self, booking_id: UUID) -> Optional[Review]:
        return self.session.query(Review).filter(Review.booking_id == booking_id).first()

    def get_provider_reviews(self, provider_id: UUID, include_hidden: bool = False) -> List[Review]:
        query = self.session.query(Review).filter(Review.provider_id == provider_id)
        if not include_hidden:
            query = query.filter(Review.is_hidden == False)
        return query.order_by(Review.created_at.desc()).all()

    def get_all_reviews(self) -> List[Review]:
        return self.session.query(Review).order_by(Review.created_at.desc()).all()

    def update_review(self, review: Review) -> Review:
        self.session.commit()
        self.session.refresh(review)
        return review
