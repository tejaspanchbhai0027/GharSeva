import pytest
from unittest.mock import Mock
from app.use_cases.service.list_categories import ListCategoriesUseCase
from app.use_cases.service.list_services import ListServicesUseCase
from app.use_cases.service.get_service import GetServiceUseCase
from app.adapters.database.sqlalchemy_models import ServiceCategory, Service

@pytest.fixture
def mock_service_repo():
    repo = Mock()
    return repo

def test_list_categories(mock_service_repo):
    category1 = ServiceCategory(name="Cleaning")
    category2 = ServiceCategory(name="Plumbing")
    mock_service_repo.get_categories.return_value = [category1, category2]

    use_case = ListCategoriesUseCase(mock_service_repo)
    result = use_case.execute()

    assert len(result) == 2
    assert result[0].name == "Cleaning"
    mock_service_repo.get_categories.assert_called_once()

def test_list_services(mock_service_repo):
    service1 = Service(name="Deep Cleaning", base_price=500.0)
    mock_service_repo.get_services.return_value = [service1]

    use_case = ListServicesUseCase(mock_service_repo)
    result = use_case.execute(search_query="Cleaning", price_max=1000.0)

    assert len(result) == 1
    assert result[0].name == "Deep Cleaning"
    mock_service_repo.get_services.assert_called_once_with(
        category_id=None,
        search_query="Cleaning",
        price_min=None,
        price_max=1000.0
    )

def test_get_service_success(mock_service_repo):
    service = Service(service_id="123", name="Leak Repair")
    mock_service_repo.get_service_by_id.return_value = service

    use_case = GetServiceUseCase(mock_service_repo)
    result = use_case.execute(service_id="123")

    assert result.name == "Leak Repair"
    mock_service_repo.get_service_by_id.assert_called_once_with("123")

def test_get_service_not_found(mock_service_repo):
    mock_service_repo.get_service_by_id.return_value = None

    use_case = GetServiceUseCase(mock_service_repo)
    with pytest.raises(ValueError, match="Service not found."):
        use_case.execute(service_id="123")
