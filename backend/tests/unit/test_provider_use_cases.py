import pytest
from unittest.mock import MagicMock
from uuid import uuid4
from datetime import datetime, time

from app.domain.protocols.provider_repo import ProviderRepo
from app.domain.protocols.user_repo import UserRepo
from app.adapters.database.sqlalchemy_models import ServiceProvider, User, Address, ProviderAvailability, Booking
from app.use_cases.provider.list_providers import ListProvidersUseCase
from app.use_cases.provider.get_provider_profile import GetProviderProfileUseCase
from app.use_cases.provider.update_provider_profile import UpdateProviderProfileUseCase
from app.use_cases.provider.manage_availability import ManageAvailabilityUseCase
from app.use_cases.provider.match_providers import MatchProvidersUseCase, haversine_distance

@pytest.fixture
def mock_provider_repo():
    return MagicMock(spec=ProviderRepo)

@pytest.fixture
def mock_user_repo():
    return MagicMock(spec=UserRepo)

def test_haversine_distance():
    # Delhi to Noida approx 20-25km depending on coordinates
    delhi = (77.2090, 28.6139) # lon, lat
    noida = (77.3910, 28.5355)
    dist = haversine_distance(delhi, noida)
    assert 20.0 <= dist <= 26.0

def test_list_providers_use_case(mock_provider_repo, mock_user_repo):
    provider_id = uuid4()
    user_id = uuid4()
    provider = ServiceProvider(
        provider_id=provider_id,
        user_id=user_id,
        bio="Experienced Plumber",
        experience_years=5,
        avg_rating=4.5,
        total_jobs=10,
        verification_status="approved",
        is_available=True
    )
    user = User(
        user_id=user_id,
        full_name="John Doe",
        email="john@provider.com",
        is_active=True
    )

    mock_provider_repo.list_providers.return_value = [provider]
    mock_user_repo.get_user_by_id.return_value = user

    use_case = ListProvidersUseCase(mock_provider_repo, mock_user_repo)
    results = use_case.execute(experience_min=3)

    assert len(results) == 1
    assert results[0]["full_name"] == "John Doe"
    assert results[0]["experience_years"] == 5

def test_get_provider_profile_not_found(mock_provider_repo, mock_user_repo):
    mock_provider_repo.get_provider_by_id.return_value = None
    use_case = GetProviderProfileUseCase(mock_provider_repo, mock_user_repo)
    with pytest.raises(ValueError, match="Service provider profile not found."):
        use_case.execute(provider_id=str(uuid4()))

def test_update_provider_profile_success(mock_provider_repo, mock_user_repo):
    provider_id = uuid4()
    user_id = uuid4()
    provider = ServiceProvider(
        provider_id=provider_id,
        user_id=user_id,
        bio="Old Bio",
        experience_years=2,
        avg_rating=4.0,
        total_jobs=5,
        is_available=True
    )
    user = User(
        user_id=user_id,
        full_name="Jane Doe",
        email="jane@provider.com",
        is_active=True
    )

    mock_provider_repo.get_provider_by_id.return_value = provider
    mock_user_repo.get_user_by_id.return_value = user

    use_case = UpdateProviderProfileUseCase(mock_provider_repo, mock_user_repo)
    updated = use_case.execute(
        provider_id=str(provider_id),
        bio="New Bio",
        experience_years=4,
        full_name="Jane Smith"
    )

    assert updated["bio"] == "New Bio"
    assert updated["experience_years"] == 4
    assert updated["full_name"] == "Jane Smith"
    mock_provider_repo.update_provider_profile.assert_called_once()
    mock_user_repo.update_user.assert_called_once()

def test_manage_availability_validation(mock_provider_repo):
    provider_id = uuid4()
    provider = ServiceProvider(provider_id=provider_id)
    mock_provider_repo.get_provider_by_id.return_value = provider

    use_case = ManageAvailabilityUseCase(mock_provider_repo)
    
    # Invalid day_of_week
    with pytest.raises(ValueError, match="day_of_week must be an integer between 0"):
        use_case.set_availability(str(provider_id), [{"day_of_week": 7, "start_time": "09:00", "end_time": "17:00"}])

    # End time before start time
    with pytest.raises(ValueError, match="start_time must be strictly earlier than end_time"):
        use_case.set_availability(str(provider_id), [{"day_of_week": 1, "start_time": "12:00", "end_time": "11:00"}])

def test_match_providers_preference_scoring(mock_provider_repo, mock_user_repo):
    # Setup coordinates
    cust_addr_id = uuid4()
    cust_addr = Address(
        address_id=cust_addr_id,
        title="Home",
        coordinates=(77.2090, 28.6139) # Delhi
    )
    
    prov_user_id = uuid4()
    prov_addr = Address(
        user_id=prov_user_id,
        title="Office",
        coordinates=(77.2200, 28.6150) # Very close, approx 1.1 km
    )
    
    prov_id = uuid4()
    provider = ServiceProvider(
        provider_id=prov_id,
        user_id=prov_user_id,
        avg_rating=4.5,
        total_jobs=10,
        verification_status="approved",
        is_available=True
    )
    prov_user = User(
        user_id=prov_user_id,
        full_name="Fast Provider",
        email="fast@provider.com",
        is_active=True
    )
    
    availability = ProviderAvailability(
        provider_id=prov_id,
        day_of_week=3, # Wednesday
        start_time=time(9, 0),
        end_time=time(17, 0),
        is_blocked=False
    )
    
    booking = Booking(
        provider_id=prov_id,
        status="completed"
    )

    mock_provider_repo.get_address_by_id.return_value = cust_addr
    mock_provider_repo.get_matching_providers_by_service.return_value = [provider]
    mock_provider_repo.get_user_primary_address.return_value = prov_addr
    mock_provider_repo.get_provider_availability.return_value = [availability]
    mock_provider_repo.get_provider_bookings.return_value = [booking]
    mock_user_repo.get_user_by_id.return_value = prov_user

    use_case = MatchProvidersUseCase(mock_provider_repo, mock_user_repo)
    
    # Matching query for Wednesday (2026-07-08 is a Wednesday) at 10:00 AM
    results = use_case.execute(
        service_id=str(uuid4()),
        scheduled_at="2026-07-08T10:00:00",
        address_id=str(cust_addr_id)
    )

    assert len(results) == 1
    assert results[0]["provider"]["full_name"] == "Fast Provider"
    assert results[0]["distance_km"] < 2.0
    assert results[0]["score"] > 0.0
