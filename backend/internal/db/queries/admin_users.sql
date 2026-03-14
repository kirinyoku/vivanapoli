-- name: GetAdminByEmail :one
SELECT * FROM admin_users
WHERE email = $1;

-- name: CreateAdmin :one
INSERT INTO admin_users (email, password_hash)
VALUES ($1, $2)
RETURNING *;
