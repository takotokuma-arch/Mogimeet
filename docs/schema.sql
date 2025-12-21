-- MogiMeet Database Schema

-- 3.1.1 events table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_token UUID NOT NULL DEFAULT gen_random_uuid(), -- Admin token for URL
  title TEXT NOT NULL,
  description TEXT,

  -- Grid Settings
  slot_interval INTEGER NOT NULL DEFAULT 30, -- 15, 30, 60 (minutes)
  display_start_time TIME NOT NULL DEFAULT '09:00',
  display_end_time TIME NOT NULL DEFAULT '23:00',

  -- Notification & Management Settings
  webhook_url TEXT, -- Discord Webhook URL
  is_notify_confirmed BOOLEAN DEFAULT TRUE, -- Notify on confirmation
  is_notify_updated BOOLEAN DEFAULT TRUE, -- Notify on update
  reminder_hours INTEGER, -- Hours before deadline to remind
  deadline_at TIMESTAMP WITH TIME ZONE, -- Response deadline

  -- Confirmed Schedule (Pink Mode)
  confirmed_start_at TIMESTAMP WITH TIME ZONE,
  confirmed_end_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.1.2 time_slots table
CREATE TABLE time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  start_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Slot start time

  UNIQUE(event_id, start_at) -- Prevent duplicates within an event
);

-- 3.1.3 responses table
CREATE TABLE responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  user_fingerprint TEXT NOT NULL, -- Anonymous ID for LocalStorage
  is_admin BOOLEAN DEFAULT FALSE, -- Admin badge
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.1.4 availability table
CREATE TABLE availability (
  response_id UUID REFERENCES responses(id) ON DELETE CASCADE,
  time_slot_id UUID REFERENCES time_slots(id) ON DELETE CASCADE,

  PRIMARY KEY (response_id, time_slot_id) -- Composite Primary Key
);

-- 3.2 Indexes
CREATE INDEX idx_availability_time_slot ON availability(time_slot_id);
CREATE INDEX idx_time_slots_event ON time_slots(event_id, start_at);
