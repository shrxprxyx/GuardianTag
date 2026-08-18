from sqlalchemy import Column, DateTime
import datetime

class TimestampMixin:
    created_at = Column(DateTime, default=datetime.datetime.utcnow)