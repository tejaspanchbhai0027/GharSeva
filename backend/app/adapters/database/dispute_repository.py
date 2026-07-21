from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.domain.protocols.dispute_repo import DisputeRepo
from app.adapters.database.sqlalchemy_models import Dispute

class DisputeRepository(DisputeRepo):
    def __init__(self, db: Session):
        self.db = db

    def create_dispute(self, dispute: Dispute) -> Dispute:
        self.db.add(dispute)
        self.db.commit()
        self.db.refresh(dispute)
        return dispute

    def get_dispute_by_id(self, dispute_id: UUID) -> Optional[Dispute]:
        return self.db.query(Dispute).filter(Dispute.dispute_id == dispute_id).first()

    def list_disputes(
        self,
        status: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> tuple[List[Dispute], int]:
        query = self.db.query(Dispute)
        
        if status:
            query = query.filter(Dispute.status == status)
            
        total = query.count()
        disputes = query.order_by(Dispute.created_at.desc()).offset(offset).limit(limit).all()
        return disputes, total

    def update_dispute(self, dispute: Dispute) -> Dispute:
        self.db.commit()
        self.db.refresh(dispute)
        return dispute
