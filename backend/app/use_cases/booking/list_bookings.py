from typing import List, Optional
from app.domain.protocols.booking_repo import BookingRepository
from app.adapters.database.sqlalchemy_models import Booking, User

class ListBookingsUseCase:
    def __init__(self, booking_repo: BookingRepository):
        self.booking_repo = booking_repo

    def execute(self, current_user: User, status_filter: Optional[str] = None) -> List[Booking]:
        if current_user.role == "customer":
            bookings = self.booking_repo.list_bookings_by_customer(current_user.user_id)
        elif current_user.role == "provider":
            bookings = self.booking_repo.list_bookings_by_provider(current_user.user_id)
        else:
            bookings = []
            
        if status_filter:
            bookings = [b for b in bookings if b.status == status_filter]
            
        return bookings
