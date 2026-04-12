-- name: GetMenuItems :many
SELECT * FROM menu_items
ORDER BY sort_order ASC;

-- name: GetMenuItemsByCategory :many
SELECT * FROM menu_items
WHERE category_id = $1
ORDER BY sort_order ASC;

-- name: GetMenuItemByID :one
SELECT * FROM menu_items
WHERE id = $1;

-- name: GetAvailableMenuItemsByCategory :many
SELECT * FROM menu_items
WHERE category_id = $1 AND is_available = TRUE
ORDER BY sort_order ASC;

-- name: CreateMenuItem :one
INSERT INTO menu_items (
    category_id, name, description,
    price_small, price_large,
    discount_price_small, discount_price_large,
    allergens, is_available, sort_order
)
VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
RETURNING *;

-- name: UpdateMenuItem :one
UPDATE menu_items
SET
    category_id          = $2,
    name                 = $3,
    description          = $4,
    price_small          = $5,
    price_large          = $6,
    discount_price_small = $7,
    discount_price_large = $8,
    allergens            = $9,
    is_available         = $10,
    sort_order           = $11
WHERE id = $1
RETURNING *;

-- name: DeleteMenuItem :exec
DELETE FROM menu_items
WHERE id = $1;
