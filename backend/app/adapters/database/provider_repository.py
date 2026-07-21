from typing import Optional, List
from uuid import UUID
from sqlalchemy.orm import Session
from app.domain.protocols.provider_repo import ProviderRepo
from app.adapters.database.sqlalchemy_models import (
    ServiceProvider, ProviderService, Service, User,
    ProviderAvailability, Address, Booking
)

class ProviderRepository(ProviderRepo):
    def __init__(self, db: Session):
        self.db = db

    def get_provider_by_id(self, provider_id: UUID) -> Optional[ServiceProvider]:
        return self.db.query(ServiceProvider).filter(ServiceProvider.provider_id == provider_id).first()

    def get_provider_by_user_id(self, user_id: UUID) -> Optional[ServiceProvider]:
        return self.db.query(ServiceProvider).filter(ServiceProvider.user_id == user_id).first()

    def update_provider_profile(self, provider: ServiceProvider) -> ServiceProvider:
        self.db.commit()
        self.db.refresh(provider)
        return provider

    def list_providers(
        self,
        category_id: Optional[UUID] = None,
        experience_min: Optional[int] = None,
        rating_min: Optional[float] = None,
        search: Optional[str] = None,
        verification_status: Optional[str] = None,
        sort_by: str = "rating",
        sort_order: str = "desc",
        limit: int = 10,
        offset: int = 0
    ) -> tuple[List[ServiceProvider], int]:
        from sqlalchemy import or_, desc, asc

        query = self.db.query(ServiceProvider).join(User, User.user_id == ServiceProvider.user_id)
        
        if verification_status:
            query = query.filter(ServiceProvider.verification_status == verification_status)
        else:
            # Only active users who are verified providers by default
            query = query.filter(
                User.is_active == True,
                ServiceProvider.verification_status == "approved"
            )

        if category_id:
            query = query.join(ProviderService, ProviderService.provider_id == ServiceProvider.provider_id) \
                         .join(Service, Service.service_id == ProviderService.service_id) \
                         .filter(Service.category_id == category_id) \
                         .distinct()

        if experience_min is not None:
            query = query.filter(ServiceProvider.experience_years >= experience_min)

        if rating_min is not None:
            query = query.filter(ServiceProvider.avg_rating >= rating_min)

        if search:
            search_term = f"%{search}%"
            query = query.filter(
                or_(
                    User.full_name.ilike(search_term),
                    ServiceProvider.bio.ilike(search_term)
                )
            )

        total_count = query.count()

        if sort_by == "rating":
            order_col = ServiceProvider.avg_rating
        elif sort_by == "experience":
            order_col = ServiceProvider.experience_years
        else:
            order_col = ServiceProvider.avg_rating # Default

        if sort_order == "asc":
            query = query.order_by(asc(order_col))
        else:
            query = query.order_by(desc(order_col))

        providers = query.offset(offset).limit(limit).all()
        return providers, total_count

    def get_provider_availability(self, provider_id: UUID) -> List[ProviderAvailability]:
        return self.db.query(ProviderAvailability).filter(
            ProviderAvailability.provider_id == provider_id
        ).order_by(ProviderAvailability.day_of_week, ProviderAvailability.start_time).all()

    def set_provider_availability(self, provider_id: UUID, slots: List[ProviderAvailability]) -> None:
        self.db.add_all(slots)
        self.db.commit()

    def clear_provider_availability(self, provider_id: UUID) -> None:
        self.db.query(ProviderAvailability).filter(
            ProviderAvailability.provider_id == provider_id
        ).delete()
        self.db.commit()

    def get_matching_providers_by_service(self, service_id: UUID) -> List[ServiceProvider]:
        return self.db.query(ServiceProvider).join(
            ProviderService, ProviderService.provider_id == ServiceProvider.provider_id
        ).filter(
            ProviderService.service_id == service_id,
            ServiceProvider.verification_status == "approved",
            ServiceProvider.is_available == True
        ).all()

    def get_user_primary_address(self, user_id: UUID) -> Optional[Address]:
        # Retrieve the first registered address for location coordinates
        return self.db.query(Address).filter(Address.user_id == user_id).order_by(Address.created_at.asc()).first()

    def get_provider_bookings(self, provider_id: UUID) -> List[Booking]:
        return self.db.query(Booking).filter(Booking.provider_id == provider_id).all()

    def get_address_by_id(self, address_id: UUID) -> Optional[Address]:
        return self.db.query(Address).filter(Address.address_id == address_id).first()

    def get_provider_services(self, provider_id: UUID) -> List[Service]:
        return self.db.query(Service).join(
            ProviderService, ProviderService.service_id == Service.service_id
        ).filter(ProviderService.provider_id == provider_id).all()
