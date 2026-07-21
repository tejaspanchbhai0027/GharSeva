from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.domain.protocols.payment_repo import PaymentRepository
from app.adapters.database.sqlalchemy_models import Payment


class SQLAlchemyPaymentRepository(PaymentRepository):
    def __init__(self, session: Session):
        self.session = session

    def create_payment(self, payment: Payment) -> Payment:
        self.session.add(payment)
        self.session.commit()
        self.session.refresh(payment)
        return payment

    def get_payment_by_id(self, payment_id: UUID) -> Optional[Payment]:
        return self.session.query(Payment).filter(Payment.payment_id == payment_id).first()

    def get_payment_by_booking_id(self, booking_id: UUID) -> Optional[Payment]:
        return self.session.query(Payment).filter(Payment.booking_id == booking_id).first()

    def get_payment_by_order_reference(self, order_reference: str) -> Optional[Payment]:
        return self.session.query(Payment).filter(Payment.order_reference == order_reference).first()

    def update_payment(self, payment: Payment) -> Payment:
        self.session.commit()
        self.session.refresh(payment)
        return payment

    def get_all_payments(self) -> List[Payment]:
        return self.session.query(Payment).order_by(Payment.created_at.desc()).all()
