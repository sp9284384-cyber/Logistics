from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, computed_field


class StatusHistoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    old_status: Optional[str] = None
    new_status: str
    note: Optional[str] = None
    changed_by: str
    created_at: datetime

    @computed_field
    @property
    def fromStatus(self) -> Optional[str]:
        return self.old_status

    @computed_field
    @property
    def toStatus(self) -> str:
        return self.new_status

    @computed_field
    @property
    def createdAt(self) -> str:
        return self.created_at.isoformat()

    @computed_field
    @property
    def admin(self) -> Optional[dict[str, str]]:
        if self.changed_by and self.changed_by != "customer":
            return {"name": self.changed_by}
        return None
