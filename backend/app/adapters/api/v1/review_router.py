from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.adapters.api.dependencies import get_current_user, get_review_repository, get_booking_repository, get_provider_repository
from app.adapters.database.sqlalchemy_models import User
from app.domain.protocols.review_repo import ReviewRepository
from app.domain.protocols.booking_repo import BookingRepository
from app.domain.protocols.provider_repo import ProviderRepository

from app.use_cases.review.submit_review import SubmitReviewUseCase, SubmitReviewInput
from app.use_cases.review.reply_to_review import ReplyToReviewUseCase, ReplyReviewInput
from app.use_cases.review.moderate_review import ModerateReviewUseCase, ModerateReviewInput
from app.use_cases.review.list_all_reviews import ListAllReviewsUseCase

router = APIRouter()

@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_review(
    input_data: SubmitReviewInput,
    current_user: User = Depends(get_current_user),
    review_repo: ReviewRepository = Depends(get_review_repository),
    booking_repo: BookingRepository = Depends(get_booking_repository),
    provider_repo: ProviderRepository = Depends(get_provider_repository)
):
    use_case = SubmitReviewUseCase(review_repo, booking_repo, provider_repo)
    try:
        return use_case.execute(current_user, input_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/{id}/reply")
async def reply_to_review(
    id: str,
    input_data: ReplyReviewInput,
    current_user: User = Depends(get_current_user),
    review_repo: ReviewRepository = Depends(get_review_repository),
    provider_repo: ProviderRepository = Depends(get_provider_repository)
):
    use_case = ReplyToReviewUseCase(review_repo, provider_repo)
    try:
        return use_case.execute(id, current_user, input_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.patch("/{id}/moderate")
async def moderate_review(
    id: str,
    input_data: ModerateReviewInput,
    current_user: User = Depends(get_current_user),
    review_repo: ReviewRepository = Depends(get_review_repository),
    provider_repo: ProviderRepository = Depends(get_provider_repository)
):
    use_case = ModerateReviewUseCase(review_repo, provider_repo)
    try:
        return use_case.execute(id, current_user, input_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

@router.get("/")
async def list_all_reviews(
    current_user: User = Depends(get_current_user),
    review_repo: ReviewRepository = Depends(get_review_repository)
):
    use_case = ListAllReviewsUseCase(review_repo)
    try:
        return use_case.execute(current_user)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(e))
