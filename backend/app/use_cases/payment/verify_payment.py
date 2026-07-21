import hmac
import hashlib
from typing import Dict, Any

from pydantic import BaseModel

from app.core.config import settings
from app.domain.protocols.payment_repo import PaymentRepository
from app.adapters.database.sqlalchemy_models import User


class VerifyPaymentInput(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str


class VerifyPaymentUseCase:
    def __init__(self, payment_repo: PaymentRepository):
        self.payment_repo = payment_repo

    def execute(self, current_user: User, input_data: VerifyPaymentInput) -> Dict[str, Any]:
        # Razorpay signature = HMAC-SHA256 of "order_id|payment_id" using key_secret
        generated_signature = hmac.new(
            settings.RAZORPAY_KEY_SECRET.encode("utf-8"),
            f"{input_data.razorpay_order_id}|{input_data.razorpay_payment_id}".encode("utf-8"),
            hashlib.sha256
        ).hexdigest()

        if not hmac.compare_digest(generated_signature, input_data.razorpay_signature):
            raise ValueError("Payment signature verification failed. Payment is not authentic.")

        # Fetch the payment record by order reference
        payment = self.payment_repo.get_payment_by_order_reference(input_data.razorpay_order_id)
        if not payment:
            raise ValueError("No pending payment found for this order.")

        # Update the payment record to captured
        payment.status = "captured"
        payment.transaction_reference = input_data.razorpay_payment_id
        self.payment_repo.update_payment(payment)

        return {
            "status": "success",
            "payment_id": str(payment.payment_id),
            "transaction_reference": input_data.razorpay_payment_id,
            "booking_id": str(payment.booking_id),
            "amount": float(payment.amount)
        }
