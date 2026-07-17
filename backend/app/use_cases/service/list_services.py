from typing import List, Optional
from app.domain.protocols.service_repo import ServiceRepository
from app.adapters.database.sqlalchemy_models import Service

class ListServicesUseCase:
    def __init__(self, service_repo: ServiceRepository):
        self.service_repo = service_repo

    def execute(
        self,
        category_id: Optional[str] = None,
        search_query: Optional[str] = None,
        price_min: Optional[float] = None,
        price_max: Optional[float] = None
    ) -> List[Service]:
        return self.service_repo.get_services(
            category_id=category_id,
            search_query=search_query,
            price_min=price_min,
            price_max=price_max
        )
