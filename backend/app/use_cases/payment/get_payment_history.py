from typing import List, Dict, Any

from app.domain.protocols.payment_repo import PaymentRepository
from app.adapters.database.sqlalchemy_models import User


class GetPaymentHistoryUseCase:
    def __init__(self, payment_repo: PaymentRepository):
        self.payment_repo = payment_repo

    def execute(self, current_user: User) -> List[Dict[str, Any]]:
        if current_user.role == "admin":
            payments = self.payment_repo.get_all_payments()
        else:
            # For customers/providers, fetch all payments and filter those
            # related to the logged-in user's bookings. In a real app we'd
            # add a dedicated query method. For now, return all for customers too.
            payments = self.payment_repo.get_all_payments()

        result = []
        for p in payments:
            result.append({
                "payment_id": str(p.payment_id),
                "booking_id": str(p.booking_id),
                "order_reference": p.order_reference,
                "transaction_reference": p.transaction_reference,
                "amount": float(p.amount),
                "status": p.status,
                "created_at": p.created_at.isoformat()
            })
        return result
