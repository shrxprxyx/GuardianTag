from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.models.device import Device

router = APIRouter(prefix="/api/v1/devices", tags=["devices"])

@router.post("/")
def create_device(name: str, db: Session = Depends(get_db)):
    device = Device(name=name, armed=False)
    db.add(device)
    db.commit()
    db.refresh(device)
    return device

@router.get("/")
def list_devices(db: Session = Depends(get_db)):
    return db.query(Device).all()

@router.patch("/{device_id}/arm")
def set_armed(device_id: str, armed: bool, db: Session = Depends(get_db)):
    device = db.query(Device).filter(Device.id == device_id).first()
    if not device:
        return {"error": "Device not found"}
    device.armed = armed
    db.commit()
    db.refresh(device)
    return device