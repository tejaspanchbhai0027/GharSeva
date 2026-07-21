from abc import ABC, abstractmethod
from typing import List, Optional
from uuid import UUID

from app.adapters.database.sqlalchemy_models import Payment


class PaymentRepository(ABC):
    @abstractmethod
    def create_payment(self, payment: Payment) -> Payment:
        pass

    @abstractmethod
    def get_payment_by_id(self, payment_id: UUID) -> Optional[Payment]:
        pass

    @abstractmethod
    def get_payment_by_booking_id(self, booking_id: UUID) -> Optional[Payment]:
        pass

    @abstractmethod
    def get_payment_by_order_reference(self, order_reference: str) -> Optional[Payment]:
        pass

    @abstractmethod
    def update_payment(self, payment: Payment) -> Payment:
        pass

    @abstractmethod
    def get_all_payments(self) -> List[Payment]:
        pass
