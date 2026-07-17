"""Initial schema setup

Revision ID: 0001_initial_schema
Revises: None
Create Date: 2026-07-07 10:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Note: Enum types (user_role, verification_status, etc.) are created automatically
    # by SQLAlchemy when create_table is called with Enum columns below.

    # 2. Create 'users' table
    op.create_table(
        'users',
        sa.Column('user_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('full_name', sa.String(length=150), nullable=False),
        sa.Column('phone', sa.String(length=15), nullable=True),
        sa.Column('role', sa.Enum('customer', 'provider', 'admin', 'support', name='user_role'), nullable=False),
        sa.Column('is_verified', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('is_active', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('profile_photo_url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint('user_id'),
        sa.UniqueConstraint('phone')
    )
    op.create_index('ix_users_email', 'users', ['email'], unique=True)
    # Create partial index on verified emails for optimization
    op.execute("CREATE INDEX idx_users_email_verified ON users (email) WHERE is_verified = TRUE")

    # 3. Create 'service_providers' table
    op.create_table(
        'service_providers',
        sa.Column('provider_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('experience_years', sa.Integer(), server_default='0', nullable=False),
        sa.Column('avg_rating', sa.Numeric(precision=3, scale=2), server_default='0.00', nullable=False),
        sa.Column('total_jobs', sa.Integer(), server_default='0', nullable=False),
        sa.Column('is_available', sa.Boolean(), server_default='true', nullable=False),
        sa.Column('service_radius_km', sa.Integer(), server_default='10', nullable=False),
        sa.Column('verification_status', sa.Enum('pending', 'approved', 'rejected', name='verification_status'), server_default='pending', nullable=False),
        sa.Column('bank_account_info', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('provider_id'),
        sa.UniqueConstraint('user_id')
    )

    # 4. Create 'service_categories' table
    op.create_table(
        'service_categories',
        sa.Column('category_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('image_url', sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint('category_id'),
        sa.UniqueConstraint('name')
    )

    # 5. Create 'services' table
    op.create_table(
        'services',
        sa.Column('service_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('category_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=150), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('base_price', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('price_type', sa.Enum('flat', 'hourly', name='price_type'), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['service_categories.category_id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('service_id')
    )

    # 6. Create many-to-many junction 'provider_services' table
    op.create_table(
        'provider_services',
        sa.Column('provider_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('service_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.ForeignKeyConstraint(['provider_id'], ['service_providers.provider_id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['service_id'], ['services.service_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('provider_id', 'service_id')
    )

    # 7. Create 'addresses' table
    op.create_table(
        'addresses',
        sa.Column('address_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=50), nullable=False),
        sa.Column('address_text', sa.Text(), nullable=False),
        sa.Column('coordinates', sa.Text(), nullable=True),  # POINT type - altered below
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('address_id')
    )
    # Alter the point column type specifically for Postgres and build the spatial GiST index
    op.execute("ALTER TABLE addresses ALTER COLUMN coordinates TYPE POINT USING coordinates::POINT")
    op.execute("CREATE INDEX idx_addresses_coords ON addresses USING gist(coordinates)")

    # 8. Create 'bookings' table
    op.create_table(
        'bookings',
        sa.Column('booking_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('provider_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('service_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('status', sa.Enum('pending', 'confirmed', 'in_progress', 'completed', 'cancelled', name='booking_status'), server_default='pending', nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('address_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('total_amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['address_id'], ['addresses.address_id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['customer_id'], ['users.user_id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['provider_id'], ['service_providers.provider_id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['service_id'], ['services.service_id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('booking_id'),
        sa.CheckConstraint('scheduled_at > created_at', name='chk_booking_scheduled_future')
    )
    op.create_index('idx_bookings_customer_status', 'bookings', ['customer_id', 'status'], unique=False)

    # 9. Create 'payments' table
    op.create_table(
        'payments',
        sa.Column('payment_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('booking_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('transaction_reference', sa.String(length=255), nullable=False),
        sa.Column('order_reference', sa.String(length=255), nullable=False),
        sa.Column('amount', sa.Numeric(precision=10, scale=2), nullable=False),
        sa.Column('status', sa.Enum('pending', 'authorized', 'captured', 'failed', 'refunded', name='payment_status'), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.booking_id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('payment_id'),
        sa.UniqueConstraint('booking_id'),
        sa.UniqueConstraint('order_reference'),
        sa.UniqueConstraint('transaction_reference')
    )

    # 10. Create 'reviews' table
    op.create_table(
        'reviews',
        sa.Column('review_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('booking_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('customer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('provider_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('reply', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.booking_id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['customer_id'], ['users.user_id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['provider_id'], ['service_providers.provider_id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('review_id'),
        sa.UniqueConstraint('booking_id'),
        sa.UniqueConstraint('booking_id', 'customer_id', name='uq_review_booking_customer'),
        sa.CheckConstraint('rating >= 1 AND rating <= 5', name='chk_review_rating_range')
    )

    # 11. Create 'disputes' table
    op.create_table(
        'disputes',
        sa.Column('dispute_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('booking_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('reason', sa.Text(), nullable=False),
        sa.Column('status', sa.Enum('open', 'under_review', 'resolved', 'dismissed', name='dispute_status'), server_default='open', nullable=False),
        sa.Column('evidence_urls', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('resolution_details', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['booking_id'], ['bookings.booking_id'], ondelete='RESTRICT'),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('dispute_id'),
        sa.UniqueConstraint('booking_id')
    )

    # 12. Create 'notifications' table
    op.create_table(
        'notifications',
        sa.Column('notification_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(length=150), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('is_read', sa.Boolean(), server_default='false', nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('notification_id')
    )

    # 13. Create 'provider_availability' table
    op.create_table(
        'provider_availability',
        sa.Column('availability_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('provider_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('day_of_week', sa.Integer(), nullable=False),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('is_blocked', sa.Boolean(), server_default='false', nullable=False),
        sa.ForeignKeyConstraint(['provider_id'], ['service_providers.provider_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('availability_id'),
        sa.CheckConstraint('day_of_week >= 0 AND day_of_week <= 6', name='chk_availability_day_of_week')
    )

    # 14. Create 'otp_tokens' table
    op.create_table(
        'otp_tokens',
        sa.Column('token_id', postgresql.UUID(as_uuid=True), server_default=sa.text('gen_random_uuid()'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('otp_code', sa.String(length=6), nullable=False),
        sa.Column('purpose', sa.Enum('email_verification', 'password_reset', name='otp_purpose'), nullable=False),
        sa.Column('expires_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('token_id')
    )


def downgrade() -> None:
    # Drop tables in reverse order of creation to prevent foreign key constraint issues
    op.drop_table('otp_tokens')
    op.drop_table('provider_availability')
    op.drop_table('notifications')
    op.drop_table('disputes')
    op.drop_table('reviews')
    op.drop_table('payments')
    op.drop_table('bookings')
    op.execute("DROP INDEX IF EXISTS idx_addresses_coords")
    op.drop_table('addresses')
    op.drop_table('provider_services')
    op.drop_table('services')
    op.drop_table('service_categories')
    op.drop_table('service_providers')
    op.execute("DROP INDEX IF EXISTS idx_users_email_verified")
    op.drop_table('users')

    # Drop custom Enum types
    op.execute("DROP TYPE otp_purpose")
    op.execute("DROP TYPE dispute_status")
    op.execute("DROP TYPE payment_status")
    op.execute("DROP TYPE booking_status")
    op.execute("DROP TYPE price_type")
    op.execute("DROP TYPE verification_status")
    op.execute("DROP TYPE user_role")
