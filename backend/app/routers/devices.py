from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.asset import Asset
from app.models.device import Device
from app.models.enums import DeviceStatus, SensorEventType
from app.models.incident import Incident
from app.models.sensor_event import SensorEvent
from app.models.user import User
from app.schemas.device import DeviceOut, DevicePairIn, DeviceUpdateIn
from app.schemas.incident import IncidentOut
from app.services.incidents import apply_event_to_incident_lifecycle
from app.ws.manager import manager

router = APIRouter(prefix="/devices", tags=["devices"])


def _get_owned_device(db: Session, user: User, device_id: UUID) -> Device:
    device = db.get(Device, device_id)
    if device is None or device.owner_id != user.id:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Device not found")
    return device


@router.get("", response_model=list[DeviceOut])
def list_devices(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[Device]:
    return db.query(Device).filter(Device.owner_id == current_user.id).all()


@router.post("/pair", response_model=DeviceOut, status_code=status.HTTP_201_CREATED)
def pair_device(
    payload: DevicePairIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Device:
    existing = db.query(Device).filter(Device.device_uid == payload.device_uid).first()
    if existing:
        raise HTTPException(status.HTTP_409_CONFLICT, "Device already paired")

    device = Device(
        owner_id=current_user.id,
        name=payload.name,
        device_uid=payload.device_uid,
        pairing_code=payload.pairing_code,
        status=DeviceStatus.ONLINE,
    )
    db.add(device)
    db.commit()
    db.refresh(device)
    return device


@router.post("/simulate-alert", response_model=IncidentOut, status_code=status.HTTP_201_CREATED)
async def simulate_alert(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Incident:
    """Testing utility: fires a real dual_verified sensor event for one of the
    user's own armed assets, going through the exact same incident-creation
    path (apply_event_to_incident_lifecycle) and websocket broadcast that a
    real device's trigger would - so it's indistinguishable from a genuine
    alert to the rest of the app. Lets the "Simulate a test alert" button in
    Guardian mode be tested with no physical hardware.

    Not gated server-side to a non-production environment - the frontend
    only shows the triggering button in dev builds (__DEV__), and this only
    ever acts on the calling user's own armed assets, so the blast radius of
    leaving it reachable is limited to that. Revisit if this backend is ever
    exposed beyond trusted testing.
    """
    asset = (
        db.query(Asset)
        .join(Device, Asset.device_id == Device.id)
        .filter(Asset.owner_id == current_user.id, Asset.is_armed.is_(True), Asset.device_id.isnot(None))
        .first()
    )
    if asset is None:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "No armed asset with a paired device to simulate an alert on")

    device = db.get(Device, asset.device_id)
    now = datetime.now(timezone.utc)

    event = SensorEvent(
        device_id=device.id,
        asset_id=asset.id,
        event_type=SensorEventType.DUAL_VERIFIED,
        payload={"simulated": True},
        device_timestamp=now,
        received_at=now,
    )
    device.last_seen_at = now
    db.add(event)
    db.commit()
    db.refresh(event)

    await manager.broadcast(
        device.id,
        {"type": "sensor_event", "event": {"id": str(event.id), "event_type": event.event_type.value, "simulated": True}},
    )

    incident = apply_event_to_incident_lifecycle(db, device, event)
    if incident is None:
        raise HTTPException(status.HTTP_500_INTERNAL_SERVER_ERROR, "Simulated event did not produce an incident")

    await manager.broadcast(
        device.id,
        {"type": "incident_created", "incident": IncidentOut.model_validate(incident).model_dump(mode="json")},
    )

    return incident


@router.get("/{device_id}", response_model=DeviceOut)
def get_device(
    device_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> Device:
    return _get_owned_device(db, current_user, device_id)


@router.patch("/{device_id}", response_model=DeviceOut)
def update_device(
    device_id: UUID,
    payload: DeviceUpdateIn,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Device:
    device = _get_owned_device(db, current_user, device_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(device, field, value)
    db.commit()
    db.refresh(device)
    return device


@router.delete("/{device_id}", status_code=status.HTTP_204_NO_CONTENT)
def unpair_device(
    device_id: UUID, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> None:
    device = _get_owned_device(db, current_user, device_id)
    db.delete(device)
    db.commit()