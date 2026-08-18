from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from app.core.database import Base, engine
from app.models import device, event, user
from app.api.routes import devices, events
from app.websocket.manager import manager

app = FastAPI(title="GuardianTag API")

Base.metadata.create_all(bind=engine)

app.include_router(devices.router)
app.include_router(events.router)

@app.get("/")
def root():
    return {"status": "GuardianTag backend running"}

@app.websocket("/ws/devices/{device_id}")
async def websocket_endpoint(websocket: WebSocket, device_id: str):
    await manager.connect(device_id, websocket)
    try:
        while True:
            await websocket.receive_text()  # keeps connection alive, ignores incoming
    except WebSocketDisconnect:
        manager.disconnect(device_id, websocket)