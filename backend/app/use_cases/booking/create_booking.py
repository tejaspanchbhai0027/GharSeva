from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.domain.protocols.booking_repo import BookingRepository
from app.adapters.database.sqlalchemy_models import Booking

class CreateBookingInput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    provider_id: str
    service_id: str
    scheduled_at: datetime
    address_id: str
    total_amount: float
    notes: Optional[str] = None

class CreateBookingUseCase:
    def __init__(self, booking_repo: BookingRepository):
        self.booking_repo = booking_repo

    def execute(self, customer_id: str, booking_data: CreateBookingInput) -> Booking:
        # Business logic validation could go here:
        # - Check if provider offers the service
        # - Check if provider is available at scheduled_at
        
        new_booking = Booking(
            customer_id=customer_id,
            provider_id=booking_data.provider_id,
            service_id=booking_data.service_id,
            status="pending",
            scheduled_at=booking_data.scheduled_at,
            address_id=booking_data.address_id,
            total_amount=booking_data.total_amount,
            notes=booking_data.notes
        )
        return self.booking_repo.create_booking(new_booking)
