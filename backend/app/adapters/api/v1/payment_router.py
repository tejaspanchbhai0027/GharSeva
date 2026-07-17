from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class PaymentInitiate(BaseModel):
    booking_id: str

class PaymentVerify(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str

@router.post("/initiate")
async def initiate_payment(payment: PaymentInitiate):
    return {
        "order_id": "mock_razorpay_order_id",
        "amount": 999.0,
        "currency": "INR",
        "razorpay_key": "rzp_test_placeholder"
    }

@router.post("/verify")
async def verify_payment(verification: PaymentVerify):
    return {"status": "success", "transaction_id": "mock_txn_123456"}
