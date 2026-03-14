-- name: CreateOrder :one
INSERT INTO orders (
    customer_name, customer_phone, customer_address,
    order_type, items, total_price, comment
)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetOrders :many
SELECT * FROM orders
ORDER BY created_at DESC;

-- name: GetOrderByID :one
SELECT * FROM orders
WHERE id = $1;

-- name: UpdateOrderStatus :one
UPDATE orders
SET order_status = $2
WHERE id = $1
RETURNING *;
