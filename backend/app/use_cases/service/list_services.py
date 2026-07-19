from typing import List, Optional, Dict, Any
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
        price_max: Optional[float] = None,
        is_featured: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        services = self.service_repo.get_services(
            category_id=category_id,
            search_query=search_query,
            price_min=price_min,
            price_max=price_max,
            is_featured=is_featured
        )
        return [
            {
                "service_id": str(s.service_id),
                "category_id": str(s.category_id),
                "name": s.name,
                "description": s.description,
                "base_price": float(s.base_price),
                "price_type": s.price_type,
                "is_featured": s.is_featured
            }
            for s in services
        ]
