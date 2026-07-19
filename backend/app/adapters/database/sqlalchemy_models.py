from sqlalchemy import (
    Column, String, Integer, Boolean, Text, ForeignKey,
    DateTime, Numeric, Enum, CheckConstraint, UniqueConstraint, Index, Time, func, text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.types import UserDefinedType
from app.core.database import Base

# Custom PostgreSQL POINT type for coordinates
class PostgresPoint(UserDefinedType):
    def get_col_spec(self, **kw):
        return "POINT"

    def bind_processor(self, dialect):
        def process(value):
            if value is None:
                return None
            # Standard coordinates input is expected as (longitude, latitude) i.e. (x, y)
            if isinstance(value, (tuple, list)):
                return f"({value[0]},{value[1]})"
            return value
        return process

    def result_processor(self, dialect, coltype):
        def process(value):
            if value is None:
                return None
            # PG Point output comes as '(x,y)'
            s = value.strip("()")
            parts = s.split(",")
            return (float(parts[0]), float(parts[1]))
        return process


class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(150), nullable=False)
    phone = Column(String(15), unique=True, nullable=True)
    role = Column(
        Enum("customer", "provider", "admin", "support", name="user_role"),
        nullable=False
    )
    is_verified = Column(Boolean, default=False, nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    profile_photo_url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False
    )


class ServiceProvider(Base):
    __tablename__ = "service_providers"

    provider_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        unique=True,
        nullable=False
    )
    bio = Column(Text, nullable=True)
    experience_years = Column(Integer, default=0, nullable=False)
    avg_rating = Column(Numeric(3, 2), default=0.00, nullable=False)
    total_jobs = Column(Integer, default=0, nullable=False)
    is_available = Column(Boolean, default=True, nullable=False)
    service_radius_km = Column(Integer, default=10, nullable=False)
    verification_status = Column(
        Enum("pending", "approved", "rejected", name="verification_status"),
        default="pending",
        nullable=False
    )
    bank_account_info = Column(JSONB, nullable=True)


class ServiceCategory(Base):
    __tablename__ = "service_categories"

    category_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    image_url = Column(Text, nullable=True)


class Service(Base):
    __tablename__ = "services"

    service_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    category_id = Column(
        UUID(as_uuid=True),
        ForeignKey("service_categories.category_id", ondelete="RESTRICT"),
        nullable=False
    )
    name = Column(String(150), nullable=False)
    description = Column(Text, nullable=True)
    base_price = Column(Numeric(10, 2), nullable=False)
    price_type = Column(
        Enum("flat", "hourly", name="price_type"),
        nullable=False
    )
    is_featured = Column(Boolean, default=False, nullable=False)


class ProviderService(Base):
    __tablename__ = "provider_services"

    provider_id = Column(
        UUID(as_uuid=True),
        ForeignKey("service_providers.provider_id", ondelete="CASCADE"),
        primary_key=True
    )
    service_id = Column(
        UUID(as_uuid=True),
        ForeignKey("services.service_id", ondelete="CASCADE"),
        primary_key=True
    )


class Address(Base):
    __tablename__ = "addresses"

    address_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False
    )
    title = Column(String(50), nullable=False)
    address_text = Column(Text, nullable=False)
    coordinates = Column(PostgresPoint, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Booking(Base):
    __tablename__ = "bookings"

    booking_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False
    )
    provider_id = Column(
        UUID(as_uuid=True),
        ForeignKey("service_providers.provider_id", ondelete="RESTRICT"),
        nullable=False
    )
    service_id = Column(
        UUID(as_uuid=True),
        ForeignKey("services.service_id", ondelete="RESTRICT"),
        nullable=False
    )
    status = Column(
        Enum("pending", "confirmed", "in_progress", "completed", "cancelled", name="booking_status"),
        default="pending",
        nullable=False
    )
    scheduled_at = Column(DateTime(timezone=True), nullable=False)
    address_id = Column(
        UUID(as_uuid=True),
        ForeignKey("addresses.address_id", ondelete="RESTRICT"),
        nullable=False
    )
    total_amount = Column(Numeric(10, 2), nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("scheduled_at > created_at", name="chk_booking_scheduled_future"),
        Index("idx_bookings_customer_status", "customer_id", "status"),
    )


class Payment(Base):
    __tablename__ = "payments"

    payment_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    booking_id = Column(
        UUID(as_uuid=True),
        ForeignKey("bookings.booking_id", ondelete="RESTRICT"),
        unique=True,
        nullable=False
    )
    transaction_reference = Column(String(255), unique=True, nullable=False)
    order_reference = Column(String(255), unique=True, nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    status = Column(
        Enum("pending", "authorized", "captured", "failed", "refunded", name="payment_status"),
        nullable=False
    )
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Review(Base):
    __tablename__ = "reviews"

    review_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    booking_id = Column(
        UUID(as_uuid=True),
        ForeignKey("bookings.booking_id", ondelete="RESTRICT"),
        unique=True,
        nullable=False
    )
    customer_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False
    )
    provider_id = Column(
        UUID(as_uuid=True),
        ForeignKey("service_providers.provider_id", ondelete="RESTRICT"),
        nullable=False
    )
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    reply = Column(Text, nullable=True)
    is_hidden = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        CheckConstraint("rating >= 1 AND rating <= 5", name="chk_review_rating_range"),
        UniqueConstraint("booking_id", "customer_id", name="uq_review_booking_customer"),
    )


class Dispute(Base):
    __tablename__ = "disputes"

    dispute_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    booking_id = Column(
        UUID(as_uuid=True),
        ForeignKey("bookings.booking_id", ondelete="RESTRICT"),
        unique=True,
        nullable=False
    )
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="RESTRICT"),
        nullable=False
    )
    reason = Column(Text, nullable=False)
    status = Column(
        Enum("open", "under_review", "resolved", "dismissed", name="dispute_status"),
        default="open",
        nullable=False
    )
    evidence_urls = Column(JSONB, nullable=True)
    resolution_details = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Notification(Base):
    __tablename__ = "notifications"

    notification_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False
    )
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class ProviderAvailability(Base):
    __tablename__ = "provider_availability"

    availability_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    provider_id = Column(
        UUID(as_uuid=True),
        ForeignKey("service_providers.provider_id", ondelete="CASCADE"),
        nullable=False
    )
    day_of_week = Column(Integer, nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    is_blocked = Column(Boolean, default=False, nullable=False)

    __table_args__ = (
        CheckConstraint("day_of_week >= 0 AND day_of_week <= 6", name="chk_availability_day_of_week"),
    )


class OTPToken(Base):
    __tablename__ = "otp_tokens"

    token_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))
    user_id = Column(
        UUID(as_uuid=True),
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False
    )
    otp_code = Column(String(6), nullable=False)
    purpose = Column(
        Enum("email_verification", "password_reset", name="otp_purpose"),
        nullable=False
    )
    expires_at = Column(DateTime(timezone=True), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
