import razorpay
from uuid import UUID
from typing import Dict, Any

from pydantic import BaseModel

from app.core.config import settings
from app.domain.protocols.payment_repo import PaymentRepository
from app.domain.protocols.booking_repo import BookingRepository
from app.adapters.database.sqlalchemy_models import Payment, User


class InitiatePaymentInput(BaseModel):
    booking_id: str


class InitiatePaymentUseCase:
    def __init__(self, payment_repo: PaymentRepository, booking_repo: BookingRepository):
        self.payment_repo = payment_repo
        self.booking_repo = booking_repo
        self.client = razorpay.Client(
            auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET)
        )

    def execute(self, current_user: User, input_data: InitiatePaymentInput) -> Dict[str, Any]:
        booking_id = UUID(input_data.booking_id)

        # Check if already paid
        existing_payment = self.payment_repo.get_payment_by_booking_id(booking_id)
        if existing_payment and existing_payment.status == "captured":
            raise ValueError("This booking has already been paid.")

        # Fetch the booking
        booking = self.booking_repo.get_booking_by_id(booking_id)
        if not booking:
            raise ValueError("Booking not found.")

        if booking.status != "completed":
            raise ValueError("Payment can only be initiated for completed bookings.")

        if current_user.role == "customer" and booking.customer_id != current_user.user_id:
            raise ValueError("You can only pay for your own bookings.")

        amount_paise = int(float(booking.total_amount) * 100)  # Razorpay uses smallest unit

        # Create Razorpay order
        try:
            order = self.client.order.create({
                "amount": amount_paise,
                "currency": "INR",
                "receipt": str(booking_id)[:40],
                "notes": {
                    "booking_id": str(booking_id),
                    "customer_id": str(current_user.user_id)
                }
            })
        except Exception as e:
            raise ValueError(f"Failed to create Razorpay order: {str(e)}")

        # Persist a pending Payment record, or update existing pending one
        if existing_payment and existing_payment.status == "pending":
            # Update the order reference in case it changed
            existing_payment.order_reference = order["id"]
            self.payment_repo.update_payment(existing_payment)
        else:
            new_payment = Payment(
                booking_id=booking_id,
                order_reference=order["id"],
                transaction_reference="pending",  # will be updated after capture
                amount=booking.total_amount,
                status="pending"
            )
            self.payment_repo.create_payment(new_payment)

        return {
            "order_id": order["id"],
            "amount": amount_paise,
            "currency": "INR",
            "razorpay_key": settings.RAZORPAY_KEY_ID,
            "booking_id": str(booking_id),
            "prefill": {
                "name": current_user.full_name,
                "email": current_user.email,
                "contact": current_user.phone or ""
            }
        }
