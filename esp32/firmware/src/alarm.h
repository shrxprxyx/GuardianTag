#pragma once

#include <Arduino.h>

#include "event_queue.h"
#include "sensors.h"

enum class AlarmState : uint8_t {
  Disarmed,
  Armed,
  DisarmWindow,
  Alarming,
};

// Owns the buzzer, the disarm button, and the arm/disarm/alarm state
// machine. Runs entirely on the alarm-task core and never touches the
// network — see network.h for how confirmed events actually reach the
// backend.
class AlarmController {
 public:
  void begin();

  // Call every alarm-task tick (ALARM_TASK_PERIOD_MS).
  void update(Sensors &sensors, time_t nowEpoch);

  AlarmState state() const { return state_; }

 private:
  AlarmState state_ = AlarmState::Disarmed;

  // Button debounce state
  int lastButtonReading_ = HIGH;
  int debouncedButtonState_ = HIGH;
  unsigned long lastButtonEdgeAt_ = 0;

  // Buzzer state
  bool buzzerOn_ = false;
  unsigned long buzzerPhaseStartedAt_ = 0;

  // Disarm window timing
  unsigned long disarmWindowStartedAt_ = 0;

  // Last-seen trigger counters, used to detect "a new trigger just happened"
  unsigned long lastSeenMotionTriggerCount_ = 0;
  unsigned long lastSeenHallTriggerCount_ = 0;

  bool consumeButtonPress();
  void enqueue(EventKind kind, time_t nowEpoch);
  void setBuzzer(bool on);
  void silenceBuzzer();
  void driveBuzzerPattern(int onMs, int offMs);
};