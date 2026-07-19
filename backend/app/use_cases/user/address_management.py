from typing import List, Dict, Any, Optional
from uuid import UUID
from pydantic import BaseModel, ConfigDict
from app.domain.protocols.user_repo import UserRepo
from app.adapters.database.sqlalchemy_models import Address

class CreateAddressInput(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    title: str
    address_text: str
    lat: Optional[float] = None
    lng: Optional[float] = None

class AddressManagementUseCase:
    def __init__(self, user_repo: UserRepo):
        self.user_repo = user_repo

    def add_address(self, user_id: str, input_data: CreateAddressInput) -> Address:
        uid = UUID(user_id)
        
        coordinates = None
        if input_data.lat is not None and input_data.lng is not None:
            # (longitude, latitude)
            coordinates = (input_data.lng, input_data.lat)

        new_address = Address(
            user_id=uid,
            title=input_data.title,
            address_text=input_data.address_text,
            coordinates=coordinates
        )

        return self.user_repo.create_address(new_address)

    def list_addresses(self, user_id: str) -> List[Dict[str, Any]]:
        uid = UUID(user_id)
        addresses = self.user_repo.get_addresses_by_user_id(uid)
        
        result = []
        for addr in addresses:
            coord_dict = None
            if addr.coordinates:
                # DB stores as (lon, lat)
                coord_dict = {
                    "lat": addr.coordinates[1],
                    "lng": addr.coordinates[0]
                }
                
            result.append({
                "address_id": str(addr.address_id),
                "title": addr.title,
                "address_text": addr.address_text,
                "coordinates": coord_dict,
                "created_at": addr.created_at.isoformat()
            })
            
        return result
