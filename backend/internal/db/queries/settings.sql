-- name: GetAllSettings :many
SELECT * FROM settings;

-- name: GetSetting :one
SELECT * FROM settings
WHERE key = $1;

-- name: UpsertSetting :one
INSERT INTO settings (key, value)
VALUES ($1, $2)
ON CONFLICT (key) DO UPDATE
    SET value = EXCLUDED.value
RETURNING *;
