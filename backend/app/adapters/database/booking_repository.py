from typing import List, Optional
from sqlalchemy.orm import Session

from app.domain.protocols.booking_repo import BookingRepository
from app.adapters.database.sqlalchemy_models import Booking

class SQLAlchemyBookingRepository(BookingRepository):
    def __init__(self, session: Session):
        self.session = session

    def create_booking(self, booking: Booking) -> Booking:
        self.session.add(booking)
        self.session.commit()
        self.session.refresh(booking)
        return booking

    def get_booking_by_id(self, booking_id: str) -> Optional[Booking]:
        return self.session.query(Booking).filter(Booking.booking_id == booking_id).first()

    def list_bookings_by_customer(self, customer_id: str) -> List[Booking]:
        return self.session.query(Booking).filter(Booking.customer_id == customer_id).all()

    def list_bookings_by_provider(self, provider_id: str) -> List[Booking]:
        return self.session.query(Booking).filter(Booking.provider_id == provider_id).all()

    def update_booking_status(self, booking_id: str, new_status: str) -> Optional[Booking]:
        booking = self.get_booking_by_id(booking_id)
        if booking:
            booking.status = new_status
            self.session.commit()
            self.session.refresh(booking)
        return booking
