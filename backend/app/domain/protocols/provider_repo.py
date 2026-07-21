from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID
from app.adapters.database.sqlalchemy_models import ServiceProvider, ProviderAvailability, Address, Booking

class ProviderRepo(ABC):
    @abstractmethod
    def get_provider_by_id(self, provider_id: UUID) -> Optional[ServiceProvider]:
        pass

    @abstractmethod
    def get_provider_by_user_id(self, user_id: UUID) -> Optional[ServiceProvider]:
        pass

    @abstractmethod
    def update_provider_profile(self, provider: ServiceProvider) -> ServiceProvider:
        pass

    @abstractmethod
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
        pass

    @abstractmethod
    def get_provider_availability(self, provider_id: UUID) -> List[ProviderAvailability]:
        pass

    @abstractmethod
    def set_provider_availability(self, provider_id: UUID, slots: List[ProviderAvailability]) -> None:
        pass

    @abstractmethod
    def clear_provider_availability(self, provider_id: UUID) -> None:
        pass

    @abstractmethod
    def get_matching_providers_by_service(self, service_id: UUID) -> List[ServiceProvider]:
        pass

    @abstractmethod
    def get_user_primary_address(self, user_id: UUID) -> Optional[Address]:
        pass

    @abstractmethod
    def get_provider_bookings(self, provider_id: UUID) -> List[Booking]:
        pass

    @abstractmethod
    def get_address_by_id(self, address_id: UUID) -> Optional[Address]:
        pass

    @abstractmethod
    def get_provider_services(self, provider_id: UUID) -> List[Any]:
        pass
