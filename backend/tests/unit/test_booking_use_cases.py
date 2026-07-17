import pytest
from datetime import datetime
from unittest.mock import Mock
from app.use_cases.booking.create_booking import CreateBookingUseCase, CreateBookingInput
from app.use_cases.booking.list_bookings import ListBookingsUseCase
from app.use_cases.booking.update_booking_status import UpdateBookingStatusUseCase
from app.adapters.database.sqlalchemy_models import Booking, User

@pytest.fixture
def mock_booking_repo():
    return Mock()

def test_create_booking(mock_booking_repo):
    mock_booking_repo.create_booking.return_value = Booking(booking_id="123", status="pending")
    use_case = CreateBookingUseCase(mock_booking_repo)
    
    booking_data = CreateBookingInput(
        provider_id="prov_123",
        service_id="srv_123",
        scheduled_at=datetime.utcnow(),
        address_id="addr_123",
        total_amount=100.0,
        notes="Test note"
    )
    
    result = use_case.execute(customer_id="cust_123", booking_data=booking_data)
    assert result.booking_id == "123"
    assert result.status == "pending"
    mock_booking_repo.create_booking.assert_called_once()

def test_list_bookings_customer(mock_booking_repo):
    mock_booking_repo.list_bookings_by_customer.return_value = [Booking(booking_id="b1", status="pending")]
    use_case = ListBookingsUseCase(mock_booking_repo)
    
    user = User(user_id="cust_123", role="customer")
    result = use_case.execute(current_user=user)
    
    assert len(result) == 1
    mock_booking_repo.list_bookings_by_customer.assert_called_once_with("cust_123")

def test_update_booking_status_success(mock_booking_repo):
    mock_booking = Booking(booking_id="b1", status="pending")
    mock_booking_repo.get_booking_by_id.return_value = mock_booking
    
    mock_booking_repo.update_booking_status.return_value = Booking(booking_id="b1", status="confirmed")
    use_case = UpdateBookingStatusUseCase(mock_booking_repo)
    
    user = User(user_id="prov_123", role="provider")
    result = use_case.execute(booking_id="b1", new_status="confirmed", current_user=user)
    
    assert result.status == "confirmed"
    mock_booking_repo.update_booking_status.assert_called_once_with("b1", "confirmed")

def test_update_booking_status_invalid(mock_booking_repo):
    mock_booking_repo.get_booking_by_id.return_value = Booking(booking_id="b1", status="pending")
    use_case = UpdateBookingStatusUseCase(mock_booking_repo)
    user = User(user_id="prov_123", role="provider")
    
    with pytest.raises(ValueError, match="Invalid status"):
        use_case.execute(booking_id="b1", new_status="invalid_state", current_user=user)
