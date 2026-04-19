# API Specification

## Overview

The Viva Napoli API is a RESTful service that powers the restaurant's online ordering system and admin dashboard. It provides endpoints for browsing the menu, placing orders, and managing restaurant operations.

**Base URL:** `http://localhost:8080` (development)

**Content-Type:** `application/json`

**Authentication:** JWT Bearer tokens for admin endpoints.

## Authentication

Admin endpoints (except login) require a valid JWT token issued by the `/api/admin/login` endpoint.

### Login Flow

1. **POST /api/admin/login** with email and password.
2. On success, the API returns a JSON object containing a `token` field.
3. The client must include this token in the `Authorization` header for subsequent admin requests:
   ```
   Authorization: Bearer <token>
   ```
4. Tokens expire after **24 hours**. After expiration, the client must re‑authenticate.

### Security Notes

- The token is signed using HS256 with a secret key stored in `JWT_SECRET`.
- Passwords are hashed with bcrypt (cost factor 12) before storage.
- The login endpoint returns a generic “invalid credentials” message for security reasons (prevents email enumeration).

## Error Handling

All errors follow a consistent JSON structure:

```json
{
  "error": "Human‑readable error message",
  "code": "optional_error_code" // currently not used
}
```

### HTTP Status Codes

- `200 OK` – Request succeeded.
- `201 Created` – Resource created successfully.
- `400 Bad Request` – Invalid request payload or validation failure.
- `401 Unauthorized` – Missing or invalid authentication token.
- `403 Forbidden` – Valid token but insufficient permissions (not used in current version).
- `404 Not Found` – Resource does not exist.
- `500 Internal Server Error` – Unexpected server‑side error.

## Public Endpoints

These endpoints do not require authentication and are accessible to all clients.

### GET /api/menu

Returns the full menu grouped by category.

**Response: `200 OK`**

```json
[
  {
    "id": 1,
    "name": "Pizza",
    "slug": "pizza",
    "items": [
      {
        "id": 10,
        "category_id": 1,
        "name": "Margherita",
        "description": "Tomato, mozzarella, basil",
        "price_small": 150.0,
        "price_large": 220.0,
        "discount_price_small": 130.0,
        "discount_price_large": 200.0,
        "allergens": ["gluten", "lactose"],
        "is_available": true
      }
    ]
  }
]
```

**Notes:**

- Only items with `is_available = true` are included.
- Prices are returned as floating‑point numbers; `null` indicates the size is not offered.
- `allergens` is an array of strings (empty if none).

### GET /api/settings

Returns restaurant configuration, including opening hours and contact information.

**Response: `200 OK`**

```json
{
  "opening_hours": "{\"monday\":\"10:00-22:00\", ...}",
  "is_open": true,
  "phone": "+47 123 45 678",
  "address": "Storgata 1, Notodden"
}
```

The exact keys are stored in the `settings` table as key‑value pairs; the response is a flat object.

### POST /api/orders

Creates a new customer order. The request is validated, prices are snapshotted from the database, and an email notification is sent to the restaurant.

**Request Body**

```json
{
  "customer_name": "John Doe",
  "customer_phone": "12345678",
  "customer_address": "",
  "order_type": "pickup",
  "comment": "Extra napkins, please",
  "items": [
    {
      "menu_item_id": 10,
      "quantity": 2,
      "size": "large"
    }
  ]
}
```

**Validation Rules**

- `customer_name` – required, non‑empty.
- `customer_phone` – required, exactly 8 digits (Norwegian format).
- `order_type` – must be `"delivery"` or `"pickup"`.
- `customer_address` – required if `order_type` is `"delivery"`.
- `items` – at least one item.
- Each item:
  - `menu_item_id` – must correspond to an existing, available menu item.
  - `quantity` – positive integer.
  - `size` – either `"small"` or `"large"`.

**Response: `201 Created`**

```json
{
  "id": 42,
  "status": "new",
  "total_price": 400.0,
  "items": [
    {
      "menu_item_id": 10,
      "name": "Margherita",
      "quantity": 2,
      "size": "large",
      "unit_price": 200.0,
      "total_price": 400.0
    }
  ]
}
```

**Notes:**

- The order is rejected if the restaurant is currently closed (based on `opening_hours` and `is_open` settings).
- Email notifications are sent asynchronously; a failure does not roll back the order.

## Admin Endpoints (Protected)

All endpoints under `/api/admin/*` (except `/api/admin/login`) require a valid Bearer token.

### POST /api/admin/login

Authenticates an admin user and returns a JWT.

**Request Body**

```json
{
  "email": "admin@vivanapoli.no",
  "password": "secret"
}
```

**Response: `200 OK`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "email": "admin@vivanapoli.no"
}
```

**Error Responses**

- `400 Bad Request` – missing email or password.
- `401 Unauthorized` – invalid credentials.

### Category Management

#### GET /api/admin/menu/categories

Returns a flat list of all categories.

**Response: `200 OK`**

```json
[
  {
    "id": 1,
    "name": "Pizza",
    "slug": "pizza",
    "sort_order": 1,
    "created_at": "2024-01-01T12:00:00Z"
  }
]
```

#### POST /api/admin/menu/categories

Creates a new category.

**Request Body**

```json
{
  "name": "Pasta",
  "slug": "pasta",
  "sort_order": 2
}
```

- `name` and `slug` are required.
- `slug` must be unique.

**Response: `201 Created`** – returns the created category object.

#### PUT /api/admin/menu/categories/{id}

Updates an existing category.

**Request Body** – same fields as creation, all optional (only provided fields are updated).

**Response: `200 OK`** – returns the updated category.

#### DELETE /api/admin/menu/categories/{id}

Deletes a category. Items belonging to the category are **not** deleted; their `category_id` becomes invalid.

**Response: `200 OK`** – empty body.

### Menu Item Management

#### GET /api/admin/menu/items

Returns a paginated list of all menu items (including unavailable ones).

**Response: `200 OK`**

```json
[
  {
    "id": 10,
    "category_id": 1,
    "name": "Margherita",
    "description": "Tomato, mozzarella, basil",
    "price_small": 150.0,
    "price_large": 220.0,
    "discount_price_small": 130.0,
    "discount_price_large": 200.0,
    "allergens": ["gluten", "lactose"],
    "is_available": true,
    "sort_order": 1,
    "created_at": "2024-01-01T12:00:00Z"
  }
]
```

#### POST /api/admin/menu/items

Creates a new menu item.

**Request Body**

```json
{
  "category_id": 1,
  "name": "New Pizza",
  "description": "Delicious new pizza",
  "price_small": 180.0,
  "price_large": 250.0,
  "discount_price_small": null,
  "discount_price_large": null,
  "allergens": [],
  "is_available": true,
  "sort_order": 5
}
```

- `category_id`, `name`, `price_small`, `price_large` are required.
- `allergens` is an array of strings.

**Response: `201 Created`** – returns the created item.

#### PUT /api/admin/menu/items/{id}

Updates an existing menu item.

**Request Body** – same fields as creation, all optional.

**Response: `200 OK`** – returns the updated item.

#### DELETE /api/admin/menu/items/{id}

Deletes a menu item. Orders that already contain this item are unaffected (they keep the snapshot).

**Response: `200 OK`** – empty body.

### Order Management

#### GET /api/admin/orders

Returns a list of all orders, most recent first.

**Response: `200 OK`**

```json
[
  {
    "id": 42,
    "customer_name": "John Doe",
    "customer_phone": "12345678",
    "customer_address": "",
    "order_type": "pickup",
    "order_status": "new",
    "items": "[{\"menu_item_id\":10,\"name\":\"Margherita\",...}]",
    "total_price": 400.0,
    "comment": "Extra napkins, please",
    "created_at": "2024-01-01T12:00:00Z"
  }
]
```

**Note:** The `items` field is a JSON‑B string (PostgreSQL `jsonb`) that contains the snapshot taken at order creation.

#### PUT /api/admin/orders/{id}/status

Updates an order’s status.

**Request Body**

```json
{
  "status": "confirmed"
}
```

Allowed status values: `"new"`, `"confirmed"`, `"preparing"`, `"ready"`, `"delivered"`.

**Response: `200 OK`** – returns the updated order.

### Statistics

#### GET /api/admin/stats

Returns aggregated statistics for the dashboard (total orders and revenue for today).

**Response: `200 OK`**

```json
{
  "total_orders": 5,
  "total_revenue": 1200.0
}
```

### Settings Management

#### PUT /api/admin/settings

Updates one or more global settings.

**Request Body**

```json
{
  "opening_hours": "{\"monday\":\"10:00-22:00\"}",
  "is_open": true,
  "phone": "+47 999 99 999"
}
```

Each key‑value pair is stored as a separate row in the `settings` table.

**Response: `200 OK`** – returns the updated settings object.

## Health Check

### GET /health

A simple endpoint for load‑balancers and monitoring.

**Response: `200 OK`**

```json
{
  "status": "ok"
}
```

## Rate Limiting

Currently, the API does not enforce rate limits. In a production environment it is recommended to add a rate‑limiting middleware (e.g., based on IP) for the public order endpoint to prevent abuse.

## CORS

Cross‑Origin Resource Sharing is enabled for origins listed in the `ALLOWED_ORIGINS` environment variable. The allowed methods are `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`.

## Versioning

The API is currently unversioned. Future breaking changes will be introduced under a version prefix (e.g., `/v1/api/...`).

---

_Last updated: April 2026_
