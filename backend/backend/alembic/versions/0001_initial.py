"""Initial schema: bookings, status_history, admin_users

Revision ID: 0001_initial
Revises:
Create Date: 2026-10-16

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

BOOKING_STATUSES = [
    "New", "Quoted", "Vehicle Assigned", "In Transit", "Delivered", "Cancelled"
]


def upgrade() -> None:
    op.create_table(
        "bookings",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("ref_code", sa.String(12), nullable=False),
        sa.Column("company_name", sa.String(150), nullable=False),
        sa.Column("contact_person", sa.String(100), nullable=False),
        sa.Column("phone", sa.String(15), nullable=False),
        sa.Column("email", sa.String(150), nullable=True),
        sa.Column("pickup_city", sa.String(100), nullable=False),
        sa.Column("pickup_address", sa.Text(), nullable=True),
        sa.Column("delivery_city", sa.String(100), nullable=False),
        sa.Column("delivery_address", sa.Text(), nullable=True),
        sa.Column(
            "load_type",
            sa.Enum("FTL", "Part Load", name="load_type"),
            nullable=False,
        ),
        sa.Column("vehicle_type", sa.String(50), nullable=True),
        sa.Column("weight_tons", sa.Numeric(8, 2), nullable=True),
        sa.Column("material", sa.String(150), nullable=True),
        sa.Column("pickup_date", sa.DateTime(), nullable=True),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "status",
            sa.Enum(*BOOKING_STATUSES, name="booking_status"),
            server_default="New",
            nullable=False,
        ),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("ref_code", name="uq_bookings_ref_code"),
    )
    op.create_index("ix_bookings_ref_code", "bookings", ["ref_code"])
    op.create_index("ix_bookings_phone", "bookings", ["phone"])
    op.create_index("ix_bookings_status", "bookings", ["status"])
    op.create_index("ix_bookings_load_type", "bookings", ["load_type"])

    op.create_table(
        "status_history",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column(
            "booking_id",
            sa.Integer(),
            sa.ForeignKey("bookings.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("old_status", sa.String(30), nullable=True),
        sa.Column("new_status", sa.String(30), nullable=False),
        sa.Column("note", sa.String(255), nullable=True),
        sa.Column("changed_by", sa.String(100), server_default="system", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_status_history_booking_id", "status_history", ["booking_id"])

    op.create_table(
        "admin_users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("username", sa.String(50), nullable=False),
        sa.Column("email", sa.String(150), nullable=False),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("username", name="uq_admin_users_username"),
        sa.UniqueConstraint("email", name="uq_admin_users_email"),
    )
    op.create_index("ix_admin_users_username", "admin_users", ["username"])


def downgrade() -> None:
    op.drop_index("ix_admin_users_username", table_name="admin_users")
    op.drop_table("admin_users")
    op.drop_index("ix_status_history_booking_id", table_name="status_history")
    op.drop_table("status_history")
    for idx in ("ix_bookings_load_type", "ix_bookings_status",
                "ix_bookings_phone", "ix_bookings_ref_code"):
        op.drop_index(idx, table_name="bookings")
    op.drop_table("bookings")
    op.execute("DROP TYPE IF EXISTS booking_status")
    op.execute("DROP TYPE IF EXISTS load_type")
