from typing import Protocol, List, Optional
from datetime import datetime
from app.adapters.database.sqlalchemy_models import Booking

class BookingRepository(Protocol):
    def create_booking(self, booking: Booking) -> Booking:
        """Create a new booking in the database."""
        ...

    def get_booking_by_id(self, booking_id: str) -> Optional[Booking]:
        """Fetch a single booking by ID."""
        ...

    def list_bookings_by_customer(self, customer_id: str) -> List[Booking]:
        """List all bookings for a customer."""
        ...

    def list_bookings_by_provider(self, provider_id: str) -> List[Booking]:
        """List all bookings assigned to a provider."""
        ...

    def update_booking_status(self, booking_id: str, new_status: str) -> Optional[Booking]:
        """Update the status of a booking."""
        ...
