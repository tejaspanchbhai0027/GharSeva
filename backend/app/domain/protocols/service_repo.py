from typing import Protocol, List, Optional
from app.adapters.database.sqlalchemy_models import ServiceCategory, Service

class ServiceRepository(Protocol):
    def get_categories(self) -> List[ServiceCategory]:
        """Fetch all service categories."""
        ...

    def get_services(
        self,
        category_id: Optional[str] = None,
        search_query: Optional[str] = None,
        price_min: Optional[float] = None,
        price_max: Optional[float] = None,
        is_featured: Optional[bool] = None
    ) -> List[Service]:
        """Fetch services based on filters and search."""
        ...

    def get_service_by_id(self, service_id: str) -> Optional[Service]:
        """Fetch a single service by ID."""
        ...
