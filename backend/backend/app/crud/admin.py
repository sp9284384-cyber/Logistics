from typing import Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.models.admin import AdminUser


def get_admin_by_username(db: Session, username: str) -> Optional[AdminUser]:
    return db.scalars(
        select(AdminUser).where(AdminUser.username == username)
    ).first()


def get_admin_by_identifier(db: Session, identifier: str) -> Optional[AdminUser]:
    clean = identifier.strip().lower()
    return db.scalars(
        select(AdminUser).where(
            (AdminUser.username.ilike(clean)) | (AdminUser.email.ilike(clean))
        )
    ).first()


def create_admin(db: Session, username: str, email: str, password: str) -> AdminUser:
    admin = AdminUser(
        username=username, email=email, hashed_password=hash_password(password)
    )
    db.add(admin)
    db.commit()
    db.refresh(admin)
    return admin
