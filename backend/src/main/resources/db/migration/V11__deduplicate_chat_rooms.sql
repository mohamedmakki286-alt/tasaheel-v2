CREATE TEMP TABLE duplicate_chat_rooms AS
SELECT id,
       MIN(id) OVER (
           PARTITION BY request_id, customer_id,
                        COALESCE(workshop_id, -1),
                        COALESCE(driver_id, -1)
       ) AS canonical_id
FROM chat_rooms;

UPDATE chat_messages message
SET room_id = duplicate.canonical_id
FROM duplicate_chat_rooms duplicate
WHERE message.room_id = duplicate.id
  AND duplicate.id <> duplicate.canonical_id;

DELETE FROM chat_rooms room
USING duplicate_chat_rooms duplicate
WHERE room.id = duplicate.id
  AND duplicate.id <> duplicate.canonical_id;

DROP TABLE duplicate_chat_rooms;

CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_room_request_customer_workshop
    ON chat_rooms (request_id, customer_id, workshop_id)
    WHERE workshop_id IS NOT NULL AND driver_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_chat_room_request_customer_driver
    ON chat_rooms (request_id, customer_id, driver_id)
    WHERE driver_id IS NOT NULL AND workshop_id IS NULL;
