from sqlalchemy import Column, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
import uuid, datetime
from app.core.database import Base
from app.models.enums import EventType

class Event(Base):
    __tablename__ = "events"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    device_id = Column(UUID(as_uuid=True), ForeignKey("devices.id"))
    type = Column(SAEnum(EventType), nullable=False)
    cancelled = Column(Boolean, default=False)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)