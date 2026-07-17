from typing import List
from app.domain.protocols.service_repo import ServiceRepository
from app.adapters.database.sqlalchemy_models import ServiceCategory

class ListCategoriesUseCase:
    def __init__(self, service_repo: ServiceRepository):
        self.service_repo = service_repo

    def execute(self) -> List[ServiceCategory]:
        return self.service_repo.get_categories()
