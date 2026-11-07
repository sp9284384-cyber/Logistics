from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app import crud
from app.core.security import create_access_token, verify_password
from app.models.admin import AdminUser


def login(db: Session, identifier: str, password: str) -> tuple[AdminUser, str]:
    admin = crud.admin.get_admin_by_identifier(db, identifier)
    if not admin or not admin.is_active or not verify_password(password, admin.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    return admin, create_access_token(subject=admin.username)
