import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from app.core.database import Base
from app.adapters.database.sqlalchemy_models import (
    User, ServiceProvider, ServiceCategory, Service,
    ProviderService, Address, Booking, Payment, Review,
    Dispute, Notification, ProviderAvailability, OTPToken
)

def test_sqlalchemy_model_declarations():
    """Verify that all mapped models inherit from the core Base and can be imported without errors."""
    assert issubclass(User, Base)
    assert issubclass(ServiceProvider, Base)
    assert issubclass(ServiceCategory, Base)
    assert issubclass(Service, Base)
    assert issubclass(ProviderService, Base)
    assert issubclass(Address, Base)
    assert issubclass(Booking, Base)
    assert issubclass(Payment, Base)
    assert issubclass(Review, Base)
    assert issubclass(Dispute, Base)
    assert issubclass(Notification, Base)
    assert issubclass(ProviderAvailability, Base)
    assert issubclass(OTPToken, Base)

def test_user_model_attributes():
    """Verify core attributes on the User model definition."""
    assert hasattr(User, "user_id")
    assert hasattr(User, "email")
    assert hasattr(User, "password_hash")
    assert hasattr(User, "full_name")
    assert hasattr(User, "phone")
    assert hasattr(User, "role")
    assert hasattr(User, "is_verified")
    assert hasattr(User, "is_active")

def test_booking_model_attributes():
    """Verify constraint mappings and structure on Bookings."""
    assert hasattr(Booking, "booking_id")
    assert hasattr(Booking, "customer_id")
    assert hasattr(Booking, "provider_id")
    assert hasattr(Booking, "service_id")
    assert hasattr(Booking, "status")
    assert hasattr(Booking, "scheduled_at")
    assert hasattr(Booking, "address_id")
    assert hasattr(Booking, "total_amount")
    
    # Check constraint assertions
    constraints = [c for c in Booking.__table__.constraints if c.name == "chk_booking_scheduled_future"]
    assert len(constraints) == 1

def test_review_model_attributes():
    """Verify reviews constraint structures."""
    constraints = [c for c in Review.__table__.constraints if c.name == "chk_review_rating_range"]
    assert len(constraints) == 1
    
    uniques = [c for c in Review.__table__.constraints if c.name == "uq_review_booking_customer"]
    assert len(uniques) == 1
