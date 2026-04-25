CREATE TABLE IF NOT EXISTS settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL
);

INSERT INTO settings (key, value) VALUES
    ('address', 'Storgata 74, 3674 Notodden'),
    ('phone', '47 48 44 44'),
    ('opening_hours', '14:00–22:00'),
    ('delivery_time_estimate', '60'),
    ('is_open', 'true');
