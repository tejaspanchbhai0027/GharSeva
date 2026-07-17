from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.adapters.api.dependencies import get_booking_repository, get_current_user
from app.domain.protocols.booking_repo import BookingRepository
from app.adapters.database.sqlalchemy_models import User

from app.use_cases.booking.create_booking import CreateBookingUseCase, CreateBookingInput
from app.use_cases.booking.list_bookings import ListBookingsUseCase
from app.use_cases.booking.update_booking_status import UpdateBookingStatusUseCase
from app.use_cases.booking.get_booking_details import GetBookingDetailsUseCase

router = APIRouter()

class UpdateStatusInput(BaseModel):
    status: str = Field(..., description="New booking status")

@router.get("/")
async def list_bookings(
    status_filter: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    booking_repo: BookingRepository = Depends(get_booking_repository)
):
    use_case = ListBookingsUseCase(booking_repo)
    return use_case.execute(current_user=current_user, status_filter=status_filter)


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_booking(
    booking_data: CreateBookingInput,
    current_user: User = Depends(get_current_user),
    booking_repo: BookingRepository = Depends(get_booking_repository)
):
    if current_user.role != "customer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only customers can create bookings."
        )

    use_case = CreateBookingUseCase(booking_repo)
    try:
        # Assuming string conversion for UUID based IDs is handled or we use str in input
        return use_case.execute(customer_id=str(current_user.user_id), booking_data=booking_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{id}")
async def get_booking_details(
    id: str,
    current_user: User = Depends(get_current_user),
    booking_repo: BookingRepository = Depends(get_booking_repository)
):
    use_case = GetBookingDetailsUseCase(booking_repo)
    try:
        return use_case.execute(booking_id=id, current_user=current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.patch("/{id}/status")
async def update_booking_status(
    id: str,
    status_update: UpdateStatusInput,
    current_user: User = Depends(get_current_user),
    booking_repo: BookingRepository = Depends(get_booking_repository)
):
    use_case = UpdateBookingStatusUseCase(booking_repo)
    try:
        return use_case.execute(
            booking_id=id,
            new_status=status_update.status,
            current_user=current_user
        )
    except ValueError as e:
        if "not found" in str(e).lower():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
