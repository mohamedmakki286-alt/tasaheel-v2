UPDATE customers
SET city = BTRIM(city)
WHERE city IS NOT NULL AND city <> BTRIM(city);

UPDATE workshops
SET city = BTRIM(city)
WHERE city IS NOT NULL AND city <> BTRIM(city);
