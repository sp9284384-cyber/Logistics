from typing import Optional

from pydantic import BaseModel, model_validator


class AdminLogin(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    password: str

    @model_validator(mode="before")
    @classmethod
    def set_identifier(cls, data: object) -> object:
        if isinstance(data, dict):
            username = data.get("username")
            email = data.get("email")
            if not username and email:
                data["username"] = email
            elif not email and username:
                data["email"] = username
        return data


class AdminUserOut(BaseModel):
    id: str
    username: str
    email: str
    name: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: Optional[AdminUserOut] = None
