from sqlalchemy import Column, String, Boolean
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.core.database import Base
from app.models.base import TimestampMixin

class Device(Base, TimestampMixin):
    __tablename__ = "devices"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    armed = Column(Boolean, default=False)