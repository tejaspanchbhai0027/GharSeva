from typing import Optional
from app.domain.protocols.booking_repo import BookingRepository
from app.adapters.database.sqlalchemy_models import Booking, User

class UpdateBookingStatusUseCase:
    def __init__(self, booking_repo: BookingRepository):
        self.booking_repo = booking_repo

    def execute(self, booking_id: str, new_status: str, current_user: User) -> Booking:
        booking = self.booking_repo.get_booking_by_id(booking_id)
        if not booking:
            raise ValueError("Booking not found.")

        # Basic role authorization logic could be added here
        # e.g., only providers can set to 'confirmed' or 'in_progress'
        # customers can only 'cancel'
        
        valid_statuses = ["pending", "confirmed", "in_progress", "completed", "cancelled"]
        if new_status not in valid_statuses:
            raise ValueError(f"Invalid status: {new_status}")

        updated_booking = self.booking_repo.update_booking_status(booking_id, new_status)
        return updated_booking
