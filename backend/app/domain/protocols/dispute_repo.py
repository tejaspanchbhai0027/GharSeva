from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID
from app.adapters.database.sqlalchemy_models import Dispute

class DisputeRepo(ABC):
    @abstractmethod
    def create_dispute(self, dispute: Dispute) -> Dispute:
        pass

    @abstractmethod
    def get_dispute_by_id(self, dispute_id: UUID) -> Optional[Dispute]:
        pass

    @abstractmethod
    def list_disputes(
        self,
        status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> tuple[List[Dispute], int]:
        pass

    @abstractmethod
    def update_dispute(self, dispute: Dispute) -> Dispute:
        pass
