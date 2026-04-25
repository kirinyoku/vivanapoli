CREATE TYPE order_type AS ENUM('delivery', 'pickup');
CREATE TYPE order_status AS ENUM('new', 'confirmed', 'preparing', 'ready', 'delivered');

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(255) NOT NULL,
    customer_address TEXT NOT NULL DEFAULT '',
    order_type order_type NOT NULL,
    order_status order_status NOT NULL DEFAULT 'new',
    items JSONB NOT NULL,
    total_price NUMERIC(8, 2) NOT NULL,
    comment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
