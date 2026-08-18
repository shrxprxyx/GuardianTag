import enum

class EventType(str, enum.Enum):
    OPEN = "open"
    TILT = "tilt"
    ALARM = "alarm"