from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.event import Event
from app.models.enums import EventType
from app.websocket.manager import manager

router = APIRouter(prefix="/api/v1/events", tags=["events"])

@router.post("/")
async def create_event(device_id: str, type: EventType, db: Session = Depends(get_db)):
    event = Event(device_id=device_id, type=type)
    db.add(event)
    db.commit()
    db.refresh(event)

    await manager.broadcast(str(device_id), {
        "id": str(event.id),
        "device_id": str(event.device_id),
        "type": event.type.value,
        "cancelled": event.cancelled,
        "timestamp": event.timestamp.isoformat(),
    })

    return event

@router.get("/")
def list_events(device_id: str = None, db: Session = Depends(get_db)):
    query = db.query(Event)
    if device_id:
        query = query.filter(Event.device_id == device_id)
    return query.order_by(Event.timestamp.desc()).all()