from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import Response

from app.adapters.api.dependencies import (
    get_current_user, get_payment_repository, get_booking_repository
)
from app.adapters.database.sqlalchemy_models import User
from app.domain.protocols.payment_repo import PaymentRepository
from app.domain.protocols.booking_repo import BookingRepository

from app.use_cases.payment.initiate_payment import InitiatePaymentUseCase, InitiatePaymentInput
from app.use_cases.payment.verify_payment import VerifyPaymentUseCase, VerifyPaymentInput
from app.use_cases.payment.generate_invoice import GenerateInvoiceUseCase
from app.use_cases.payment.get_payment_history import GetPaymentHistoryUseCase

router = APIRouter()


@router.post("/initiate")
async def initiate_payment(
    input_data: InitiatePaymentInput,
    current_user: User = Depends(get_current_user),
    payment_repo: PaymentRepository = Depends(get_payment_repository),
    booking_repo: BookingRepository = Depends(get_booking_repository)
):
    """Create a Razorpay order for a completed booking."""
    use_case = InitiatePaymentUseCase(payment_repo, booking_repo)
    try:
        return use_case.execute(current_user, input_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.post("/verify")
async def verify_payment(
    input_data: VerifyPaymentInput,
    current_user: User = Depends(get_current_user),
    payment_repo: PaymentRepository = Depends(get_payment_repository)
):
    """Verify Razorpay signature and mark payment as captured."""
    use_case = VerifyPaymentUseCase(payment_repo)
    try:
        return use_case.execute(current_user, input_data)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/{booking_id}/invoice")
async def download_invoice(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    payment_repo: PaymentRepository = Depends(get_payment_repository),
    booking_repo: BookingRepository = Depends(get_booking_repository)
):
    """Generate and return a PDF invoice for a paid booking."""
    use_case = GenerateInvoiceUseCase(payment_repo, booking_repo)
    try:
        pdf_bytes = use_case.execute(booking_id, current_user)
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=gharseva-invoice-{booking_id[:8]}.pdf"
            }
        )
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/history")
async def payment_history(
    current_user: User = Depends(get_current_user),
    payment_repo: PaymentRepository = Depends(get_payment_repository)
):
    """Fetch payment history for the current user."""
    use_case = GetPaymentHistoryUseCase(payment_repo)
    return use_case.execute(current_user)


@router.get("/status/{booking_id}")
async def get_payment_status(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    payment_repo: PaymentRepository = Depends(get_payment_repository)
):
    """Check the payment status for a given booking."""
    from uuid import UUID
    payment = payment_repo.get_payment_by_booking_id(UUID(booking_id))
    if not payment:
        return {"status": None, "paid": False}
    return {
        "payment_id": str(payment.payment_id),
        "status": payment.status,
        "paid": payment.status == "captured",
        "amount": float(payment.amount),
        "transaction_reference": payment.transaction_reference,
        "created_at": payment.created_at.isoformat()
    }
