from typing import Optional
from app.domain.protocols.service_repo import ServiceRepository
from app.adapters.database.sqlalchemy_models import Service

class GetServiceUseCase:
    def __init__(self, service_repo: ServiceRepository):
        self.service_repo = service_repo

    def execute(self, service_id: str) -> Optional[Service]:
        service = self.service_repo.get_service_by_id(service_id)
        if not service:
            raise ValueError("Service not found.")
        return service
