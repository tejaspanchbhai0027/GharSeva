from datetime import time
from typing import List, Dict, Any
from uuid import UUID
from app.domain.protocols.provider_repo import ProviderRepo
from app.adapters.database.sqlalchemy_models import ProviderAvailability

class ManageAvailabilityUseCase:
    def __init__(self, provider_repo: ProviderRepo):
        self.provider_repo = provider_repo

    def get_availability(self, provider_id: str) -> List[Dict[str, Any]]:
        provider_uuid = UUID(provider_id)
        provider = self.provider_repo.get_provider_by_id(provider_uuid)
        if not provider:
            raise ValueError("Service provider profile not found.")

        slots = self.provider_repo.get_provider_availability(provider_uuid)
        return [
            {
                "availability_id": str(slot.availability_id),
                "day_of_week": slot.day_of_week,
                "start_time": slot.start_time.isoformat(),
                "end_time": slot.end_time.isoformat(),
                "is_blocked": slot.is_blocked
            }
            for slot in slots
        ]

    def set_availability(self, provider_id: str, slots_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        provider_uuid = UUID(provider_id)
        provider = self.provider_repo.get_provider_by_id(provider_uuid)
        if not provider:
            raise ValueError("Service provider profile not found.")

        # Clear existing entries
        self.provider_repo.clear_provider_availability(provider_uuid)

        new_slots = []
        for slot in slots_data:
            day_of_week = slot.get("day_of_week")
            if not isinstance(day_of_week, int) or day_of_week < 0 or day_of_week > 6:
                raise ValueError("day_of_week must be an integer between 0 (Sunday) and 6 (Saturday).")

            start_str = slot.get("start_time")
            end_str = slot.get("end_time")

            try:
                start_time = time.fromisoformat(start_str)
                end_time = time.fromisoformat(end_str)
            except (ValueError, TypeError):
                raise ValueError("Times must be provided in valid ISO format (e.g. '09:00' or '17:30:00').")

            if start_time >= end_time:
                raise ValueError("start_time must be strictly earlier than end_time.")

            new_slots.append(
                ProviderAvailability(
                    provider_id=provider_uuid,
                    day_of_week=day_of_week,
                    start_time=start_time,
                    end_time=end_time,
                    is_blocked=slot.get("is_blocked", False)
                )
            )

        if new_slots:
            self.provider_repo.set_provider_availability(provider_uuid, new_slots)

        return self.get_availability(provider_id)
