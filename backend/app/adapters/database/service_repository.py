from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.domain.protocols.service_repo import ServiceRepository
from app.adapters.database.sqlalchemy_models import ServiceCategory, Service

class SQLAlchemyServiceRepository(ServiceRepository):
    def __init__(self, session: Session):
        self.session = session

    def get_categories(self) -> List[ServiceCategory]:
        return self.session.query(ServiceCategory).all()

    def get_services(
        self,
        category_id: Optional[str] = None,
        search_query: Optional[str] = None,
        price_min: Optional[float] = None,
        price_max: Optional[float] = None
    ) -> List[Service]:
        query = self.session.query(Service)
        
        if category_id:
            query = query.filter(Service.category_id == category_id)
            
        if search_query:
            search = f"%{search_query}%"
            query = query.filter(
                or_(
                    Service.name.ilike(search),
                    Service.description.ilike(search)
                )
            )
            
        if price_min is not None:
            query = query.filter(Service.base_price >= price_min)
            
        if price_max is not None:
            query = query.filter(Service.base_price <= price_max)
            
        return query.all()

    def get_service_by_id(self, service_id: str) -> Optional[Service]:
        return self.session.query(Service).filter(Service.service_id == service_id).first()
