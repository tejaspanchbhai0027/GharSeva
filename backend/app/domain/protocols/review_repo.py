from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.adapters.database.sqlalchemy_models import Review

class ReviewRepository(ABC):
    @abstractmethod
    def create_review(self, review: Review) -> Review:
        pass

    @abstractmethod
    def get_review_by_id(self, review_id: UUID) -> Optional[Review]:
        pass

    @abstractmethod
    def get_review_by_booking_id(self, booking_id: UUID) -> Optional[Review]:
        pass

    @abstractmethod
    def get_provider_reviews(self, provider_id: UUID, include_hidden: bool = False) -> List[Review]:
        pass

    @abstractmethod
    def get_all_reviews(self) -> List[Review]:
        pass

    @abstractmethod
    def update_review(self, review: Review) -> Review:
        pass
