# Viva Napoli (Backend)

## Stack
- **Go 1.25** — The main programming language.
- **Chi v5** — A fast and simple router for HTTP requests.
- **sqlc** — Generates safe Go code from SQL queries.
- **pgx v5** — A driver to connect to the PostgreSQL database.
- **golang-migrate** — A tool to manage database changes (migrations).
- **slog** — Structured logging (built-in Go library).
- **Docker & Docker Compose** — For running the app and database in containers.

---

## Project Structure
```text
backend/
├── cmd/
│   ├── server/          # Main entry point (main.go)
│   └── seed/            # Script to fill the database with initial data
├── internal/
│   ├── config/          # Loads settings from the .env file
│   ├── db/              # Database connection, migrations, and sqlc
│   │   ├── generated/   # Code created by sqlc (DO NOT EDIT)
│   │   ├── migrations/  # SQL files for database structure
│   │   └── queries/     # SQL files for database actions
│   └── handler/         # HTTP handlers (business logic)
├── Dockerfile           # Instructions to build the app image
└── docker-compose.yml   # Configuration for App + Database services
```

---

## Database Methods (sqlc)
We use `sqlc` to turn SQL into Go functions. These are the main methods in the `Queries` struct:

| Entity | Methods |
| :--- | :--- |
| **Categories** | `CreateCategory`, `GetCategories`, `UpdateCategory`, `DeleteCategory` |
| **Menu Items** | `CreateMenuItem`, `GetMenuItems`, `GetAvailableMenuItemsByCategory`, `UpdateMenuItem`, `DeleteMenuItem` |
| **Orders** | `CreateOrder`, `GetOrders`, `UpdateOrderStatus` |
| **Settings** | `GetAllSettings`, `UpsertSetting` |
| **Admin** | `GetAdminByEmail`, `CreateAdmin` |

---

## How to run

### Prerequisites
- Go 1.25 or higher
- Docker & Docker Compose
- `migrate` tool (if you want to run migrations manually)

### 1. Quick Start (Using Docker)
Run the entire project with one command:
```bash
docker-compose up --build
```

### 2. Manual Start (For Development)
1. Start the database only: `docker-compose up -d postgres`
2. Create a `.env` file (use `.env-example` as a template).
3. Run migrations: `make migrate-up`
4. Fill the database with data (optional): `make seed`
5. Start the server: `go run cmd/server/main.go`

---

## API Endpoints

### Public Endpoints
- `GET  /health` — Check if the server is running.
- `GET  /api/menu` — Get the menu grouped by categories.
- `GET  /api/settings` — Get restaurant information.
- `POST /api/orders` — Create a new order.

### Admin Endpoints (Protected — Needs JWT)
- `POST /api/admin/login` — Log in and get a token.
- **Categories:** `GET/POST/PUT/DELETE` at `/api/admin/menu/categories`
- **Items:** `GET/POST/PUT/DELETE` at `/api/admin/menu/items`
- **Orders:** `GET /api/admin/orders`, `PUT /api/admin/orders/{id}/status`
- **Settings:** `PUT /api/admin/settings`

---

## Basic testing
To run the tests, use:
```bash
go test ./internal/handler/... -v
```

---

## Useful Commands (Makefile)
- `make sqlc`: Update Go code from SQL files.
- `make migrate-up`: Apply all database changes.
- `make migrate-down`: Undo the last database change.
- `make seed`: Fill the database with start data.
