import math
from datetime import datetime, time
from typing import List, Dict, Any, Optional
from uuid import UUID
from app.domain.protocols.provider_repo import ProviderRepo
from app.domain.protocols.user_repo import UserRepo

def haversine_distance(coord1: tuple, coord2: tuple) -> float:
    # coordinates are (longitude, latitude)
    lon1, lat1 = coord1
    lon2, lat2 = coord2

    # convert decimal degrees to radians
    lon1_rad, lat1_rad = map(math.radians, [lon1, lat1])
    lon2_rad, lat2_rad = map(math.radians, [lon2, lat2])

    # haversine formula
    dlon = lon2_rad - lon1_rad
    dlat = lat2_rad - lat1_rad
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    r = 6371.0 # Earth's radius in km
    return c * r

class MatchProvidersUseCase:
    def __init__(self, provider_repo: ProviderRepo, user_repo: UserRepo):
        self.provider_repo = provider_repo
        self.user_repo = user_repo

    def execute(
        self,
        service_id: str,
        scheduled_at: str,
        address_id: str
    ) -> List[Dict[str, Any]]:
        service_uuid = UUID(service_id)
        address_uuid = UUID(address_id)

        # Parse schedule date/time
        try:
            scheduled_dt = datetime.fromisoformat(scheduled_at)
        except ValueError:
            raise ValueError("scheduled_at must be in valid ISO 8601 format.")

        # 1. Fetch customer address and verify coordinates
        customer_address = self.provider_repo.get_address_by_id(address_uuid)
        if not customer_address:
            raise ValueError("Customer booking address not found.")
        if not customer_address.coordinates:
            raise ValueError("Customer booking address is missing location coordinates.")

        # 2. Get approved and active candidate providers offering this service
        candidates = self.provider_repo.get_matching_providers_by_service(service_uuid)

        matched_providers = []

        # Convert datetime to local timezone weekday (Sunday=0 to Saturday=6)
        # python weekday(): Monday=0, Sunday=6
        day_of_week = (scheduled_dt.weekday() + 1) % 7
        booking_time = scheduled_dt.time()

        for provider in candidates:
            # Check rating threshold (avg_rating > 3.5). Allow new providers (rating = 0.0) to bootstrap.
            avg_rating = float(provider.avg_rating)
            if avg_rating < 3.5 and provider.total_jobs > 0:
                continue

            # Check provider coordinates
            provider_address = self.provider_repo.get_user_primary_address(provider.user_id)
            if not provider_address or not provider_address.coordinates:
                continue

            # Verify geographic proximity (< 10 km)
            distance = haversine_distance(customer_address.coordinates, provider_address.coordinates)
            if distance >= 10.0:
                continue

            # Verify availability slots for the specific time
            slots = self.provider_repo.get_provider_availability(provider.provider_id)
            is_available = False
            for slot in slots:
                if slot.day_of_week == day_of_week:
                    if slot.start_time <= booking_time <= slot.end_time:
                        if not slot.is_blocked:
                            is_available = True
                            break
            if not is_available:
                continue

            # Calculate Completion Rate score
            bookings = self.provider_repo.get_provider_bookings(provider.provider_id)
            completed_bookings = [b for b in bookings if b.status == "completed"]
            cancelled_bookings = [b for b in bookings if b.status == "cancelled"]
            finished_bookings_count = len(completed_bookings) + len(cancelled_bookings)

            if finished_bookings_count > 0:
                completion_rate = len(completed_bookings) / finished_bookings_count
            else:
                completion_rate = 1.0 # Default for new providers is 100%

            # Mock Response Time score
            response_time_score = 0.9 # Constant high-quality response score

            # Normalize values to 0.0-1.0 range
            rating_score = avg_rating / 5.0
            distance_score = 1.0 - (distance / 10.0) # Closer distance = higher score
            completion_score = completion_rate

            # Weighted preference scoring: Rating (30%), Distance (25%), Completion Rate (25%), Response Time (20%)
            score = (rating_score * 0.30) + (distance_score * 0.25) + (completion_score * 0.25) + (response_time_score * 0.20)

            # Gather provider user profile details
            user = self.user_repo.get_user_by_id(provider.user_id)
            if not user or not user.is_active:
                continue

            matched_providers.append({
                "score": round(score, 4),
                "distance_km": round(distance, 2),
                "provider": {
                    "provider_id": str(provider.provider_id),
                    "user_id": str(provider.user_id),
                    "full_name": user.full_name,
                    "email": user.email,
                    "phone": user.phone,
                    "profile_photo_url": user.profile_photo_url,
                    "bio": provider.bio,
                    "experience_years": provider.experience_years,
                    "avg_rating": avg_rating,
                    "total_jobs": provider.total_jobs
                }
            })

        # Sort by score descending and return top 5
        matched_providers.sort(key=lambda x: x["score"], reverse=True)
        return matched_providers[:5]
