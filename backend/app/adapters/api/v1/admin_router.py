"""
Admin Router - All admin-only API endpoints.
Protected by RoleChecker("admin") on every route.
"""
from typing import Optional, List
from uuid import UUID
from datetime import datetime
import csv
import io

from fastapi import APIRouter, Depends, HTTPException, status, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.adapters.api.dependencies import (
    get_user_repository, get_provider_repository, get_service_repository,
    get_booking_repository, get_payment_repository, get_dispute_repository,
    get_current_user, RoleChecker
)
from app.adapters.database.user_repository import UserRepository
from app.adapters.database.provider_repository import ProviderRepository
from app.adapters.database.service_repository import SQLAlchemyServiceRepository
from app.adapters.database.booking_repository import SQLAlchemyBookingRepository
from app.adapters.database.payment_repository import SQLAlchemyPaymentRepository
from app.adapters.database.dispute_repository import DisputeRepository
from app.adapters.database.sqlalchemy_models import (
    User, ServiceCategory, Service, Dispute
)

router = APIRouter()

# ── Permission guard ─────────────────────────────────────────────────────────
admin_only = RoleChecker(["admin"])


# ═══════════════════════════════════════════════════════════════════════════════
# Pydantic schemas
# ═══════════════════════════════════════════════════════════════════════════════
class UserStatusUpdate(BaseModel):
    is_active: bool

class ProviderVerificationUpdate(BaseModel):
    verification_status: str  # "approved" | "rejected"

class CreateCategoryInput(BaseModel):
    name: str
    description: Optional[str] = None
    image_url: Optional[str] = None

class CreateServiceInput(BaseModel):
    category_id: str
    name: str
    description: Optional[str] = None
    base_price: float
    price_type: str = "flat"   # "flat" | "hourly"
    is_featured: bool = False

class DisputeResolutionInput(BaseModel):
    status: str          # "resolved" | "dismissed" | "under_review"
    resolution_details: Optional[str] = None
    issue_refund: bool = False


# ═══════════════════════════════════════════════════════════════════════════════
# USER MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/users")
async def list_all_users(
    search: Optional[str] = None,
    role: Optional[str] = None,
    is_active: Optional[bool] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    current_user: User = Depends(admin_only),
    user_repo: UserRepository = Depends(get_user_repository),
):
    """List all platform users with optional filtering."""
    offset = (page - 1) * limit
    users, total = user_repo.list_users(search=search, role=role, is_active=is_active, limit=limit, offset=offset)
    return {
        "items": [
            {
                "user_id": str(u.user_id),
                "email": u.email,
                "full_name": u.full_name,
                "phone": u.phone,
                "role": u.role,
                "is_verified": u.is_verified,
                "is_active": u.is_active,
                "profile_photo_url": u.profile_photo_url,
                "created_at": u.created_at.isoformat() if u.created_at else None,
            }
            for u in users
        ],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.patch("/users/{user_id}/status")
async def update_user_status(
    user_id: str,
    body: UserStatusUpdate,
    current_user: User = Depends(admin_only),
    user_repo: UserRepository = Depends(get_user_repository),
):
    """Suspend or activate a user account."""
    user = user_repo.get_user_by_id(UUID(user_id))
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if str(user.user_id) == str(current_user.user_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot modify your own account")
    user.is_active = body.is_active
    user_repo.update_user(user)
    return {"message": f"User account {'activated' if body.is_active else 'suspended'} successfully", "is_active": user.is_active}


# ═══════════════════════════════════════════════════════════════════════════════
# PROVIDER VERIFICATION
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/providers/pending")
async def list_pending_providers(
    verification_status: str = "pending",
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    current_user: User = Depends(admin_only),
    provider_repo: ProviderRepository = Depends(get_provider_repository),
    user_repo: UserRepository = Depends(get_user_repository),
):
    """List providers filtered by verification status."""
    offset = (page - 1) * limit
    providers, total = provider_repo.list_providers(
        verification_status=verification_status, limit=limit, offset=offset
    )
    items = []
    for p in providers:
        user = user_repo.get_user_by_id(p.user_id)
        items.append({
            "provider_id": str(p.provider_id),
            "user_id": str(p.user_id),
            "full_name": user.full_name if user else "N/A",
            "email": user.email if user else "N/A",
            "phone": user.phone if user else None,
            "bio": p.bio,
            "experience_years": p.experience_years,
            "avg_rating": float(p.avg_rating),
            "total_jobs": p.total_jobs,
            "verification_status": p.verification_status,
            "is_available": p.is_available,
        })
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


@router.patch("/providers/{provider_id}/verify")
async def verify_provider(
    provider_id: str,
    body: ProviderVerificationUpdate,
    current_user: User = Depends(admin_only),
    provider_repo: ProviderRepository = Depends(get_provider_repository),
):
    """Approve or reject a provider application."""
    if body.verification_status not in ("approved", "rejected", "pending"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid verification_status value")
    provider = provider_repo.get_provider_by_id(UUID(provider_id))
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")
    provider.verification_status = body.verification_status
    provider_repo.update_provider_profile(provider)
    return {"message": f"Provider {body.verification_status}", "verification_status": body.verification_status}


# ═══════════════════════════════════════════════════════════════════════════════
# DISPUTES
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/disputes")
async def list_disputes(
    dispute_status: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, le=100),
    current_user: User = Depends(admin_only),
    dispute_repo: DisputeRepository = Depends(get_dispute_repository),
    user_repo: UserRepository = Depends(get_user_repository),
):
    """List all disputes with optional status filter."""
    offset = (page - 1) * limit
    disputes, total = dispute_repo.list_disputes(status=dispute_status, limit=limit, offset=offset)
    items = []
    for d in disputes:
        filed_by = user_repo.get_user_by_id(d.user_id)
        items.append({
            "dispute_id": str(d.dispute_id),
            "booking_id": str(d.booking_id),
            "filed_by_name": filed_by.full_name if filed_by else "Unknown",
            "filed_by_email": filed_by.email if filed_by else "Unknown",
            "reason": d.reason,
            "status": d.status,
            "resolution_details": d.resolution_details,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        })
    return {"items": items, "total": total, "page": page, "limit": limit}


@router.patch("/disputes/{dispute_id}")
async def resolve_dispute(
    dispute_id: str,
    body: DisputeResolutionInput,
    current_user: User = Depends(admin_only),
    dispute_repo: DisputeRepository = Depends(get_dispute_repository),
    booking_repo: SQLAlchemyBookingRepository = Depends(get_booking_repository),
    payment_repo: SQLAlchemyPaymentRepository = Depends(get_payment_repository),
):
    """Resolve or dismiss a dispute. Optionally issue a refund."""
    dispute = dispute_repo.get_dispute_by_id(UUID(dispute_id))
    if not dispute:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Dispute not found")

    dispute.status = body.status
    dispute.resolution_details = body.resolution_details
    dispute_repo.update_dispute(dispute)

    refund_issued = False
    if body.issue_refund:
        # Get the booking payment and mark as refunded
        booking = booking_repo.get_booking_by_id(str(dispute.booking_id))
        if booking:
            payment = payment_repo.get_payment_by_booking_id(booking.booking_id)
            if payment and payment.status == "captured":
                payment.status = "refunded"
                payment_repo.update_payment(payment)
                booking.status = "cancelled"
                booking_repo.update_booking_status(str(booking.booking_id), "cancelled")
                refund_issued = True

    return {
        "message": f"Dispute {body.status}",
        "refund_issued": refund_issued
    }


# ═══════════════════════════════════════════════════════════════════════════════
# SERVICE MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════════

@router.post("/services/categories", status_code=status.HTTP_201_CREATED)
async def create_service_category(
    body: CreateCategoryInput,
    current_user: User = Depends(admin_only),
    service_repo: SQLAlchemyServiceRepository = Depends(get_service_repository),
):
    """Create a new service category."""
    category = ServiceCategory(
        name=body.name,
        description=body.description,
        image_url=body.image_url,
    )
    created = service_repo.create_category(category)
    return {
        "category_id": str(created.category_id),
        "name": created.name,
        "description": created.description,
    }


@router.post("/services", status_code=status.HTTP_201_CREATED)
async def create_service(
    body: CreateServiceInput,
    current_user: User = Depends(admin_only),
    service_repo: SQLAlchemyServiceRepository = Depends(get_service_repository),
):
    """Create a new service under a category."""
    service = Service(
        category_id=UUID(body.category_id),
        name=body.name,
        description=body.description,
        base_price=body.base_price,
        price_type=body.price_type,
        is_featured=body.is_featured,
    )
    created = service_repo.create_service(service)
    return {
        "service_id": str(created.service_id),
        "name": created.name,
        "base_price": float(created.base_price),
    }


@router.get("/services/categories")
async def list_service_categories(
    current_user: User = Depends(admin_only),
    service_repo: SQLAlchemyServiceRepository = Depends(get_service_repository),
):
    """List all service categories."""
    cats = service_repo.get_categories()
    return [{"category_id": str(c.category_id), "name": c.name, "description": c.description} for c in cats]


@router.get("/services")
async def list_services(
    category_id: Optional[str] = None,
    current_user: User = Depends(admin_only),
    service_repo: SQLAlchemyServiceRepository = Depends(get_service_repository),
):
    """List all services, optionally filtered by category."""
    services = service_repo.get_services(category_id=category_id)
    return [
        {
            "service_id": str(s.service_id),
            "category_id": str(s.category_id),
            "name": s.name,
            "description": s.description,
            "base_price": float(s.base_price),
            "price_type": s.price_type,
            "is_featured": s.is_featured,
        }
        for s in services
    ]


# ═══════════════════════════════════════════════════════════════════════════════
# REPORTS / CSV EXPORT
# ═══════════════════════════════════════════════════════════════════════════════

@router.get("/reports/bookings/csv")
async def export_bookings_csv(
    current_user: User = Depends(admin_only),
    booking_repo: SQLAlchemyBookingRepository = Depends(get_booking_repository),
    user_repo: UserRepository = Depends(get_user_repository),
):
    """Download all bookings as a CSV file."""
    # Fetch all bookings (customer & any status)
    # We'll use list_bookings_by_customer for all users – instead let's query directly
    from app.core.database import SessionLocal
    from app.adapters.database.sqlalchemy_models import Booking
    
    # Use the booking_repo session to query all bookings
    db = booking_repo.session
    all_bookings = db.query(Booking).order_by(Booking.created_at.desc()).all()

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "booking_id", "customer_id", "provider_id", "service_id",
        "status", "scheduled_at", "total_amount", "notes", "created_at"
    ])
    writer.writeheader()
    for b in all_bookings:
        writer.writerow({
            "booking_id": str(b.booking_id),
            "customer_id": str(b.customer_id),
            "provider_id": str(b.provider_id),
            "service_id": str(b.service_id),
            "status": b.status,
            "scheduled_at": b.scheduled_at.isoformat() if b.scheduled_at else "",
            "total_amount": float(b.total_amount),
            "notes": b.notes or "",
            "created_at": b.created_at.isoformat() if b.created_at else "",
        })

    output.seek(0)
    filename = f"gharseva_bookings_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/reports/payments/csv")
async def export_payments_csv(
    current_user: User = Depends(admin_only),
    payment_repo: SQLAlchemyPaymentRepository = Depends(get_payment_repository),
):
    """Download all payment transactions as a CSV file."""
    all_payments = payment_repo.get_all_payments()

    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=[
        "payment_id", "booking_id", "transaction_reference", "order_reference",
        "amount", "status", "created_at"
    ])
    writer.writeheader()
    for p in all_payments:
        writer.writerow({
            "payment_id": str(p.payment_id),
            "booking_id": str(p.booking_id),
            "transaction_reference": p.transaction_reference,
            "order_reference": p.order_reference,
            "amount": float(p.amount),
            "status": p.status,
            "created_at": p.created_at.isoformat() if p.created_at else "",
        })

    output.seek(0)
    filename = f"gharseva_payments_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
