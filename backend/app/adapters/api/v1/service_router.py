from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.adapters.api.dependencies import get_service_repository
from app.domain.protocols.service_repo import ServiceRepository

from app.use_cases.service.list_categories import ListCategoriesUseCase
from app.use_cases.service.list_services import ListServicesUseCase
from app.use_cases.service.get_service import GetServiceUseCase

router = APIRouter()

@router.get("/categories")
async def get_categories(
    service_repo: ServiceRepository = Depends(get_service_repository)
):
    use_case = ListCategoriesUseCase(service_repo)
    return use_case.execute()


@router.get("/services")
async def get_services(
    category_id: Optional[str] = Query(None, description="Filter by Category ID"),
    search_query: Optional[str] = Query(None, description="Search term for name/description"),
    price_min: Optional[float] = Query(None, description="Minimum base price"),
    price_max: Optional[float] = Query(None, description="Maximum base price"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured status"),
    service_repo: ServiceRepository = Depends(get_service_repository)
):
    use_case = ListServicesUseCase(service_repo)
    return use_case.execute(
        category_id=category_id,
        search_query=search_query,
        price_min=price_min,
        price_max=price_max,
        is_featured=is_featured
    )


@router.get("/services/{id}")
async def get_service(
    id: str,
    service_repo: ServiceRepository = Depends(get_service_repository)
):
    use_case = GetServiceUseCase(service_repo)
    try:
        return use_case.execute(service_id=id)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
