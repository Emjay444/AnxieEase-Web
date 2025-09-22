-- Cleanup legacy device_name values that include user IDs
-- Run this in Supabase SQL editor if you still see '(User: ...)' in device_name

update wearable_devices
set device_name = 'AnxieEase Sensor #001'
where device_id = 'AnxieEase001';
