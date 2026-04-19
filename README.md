# Viva Napoli

A full‑stack web application for a pizzeria. It provides an efficient ordering experience for customers and a management dashboard for restaurant owners.

## Key Features

- **Server‑side rendered menu**: Real‑time shop status (open/closed) based on Norwegian timezone.
- **Shopping cart**: Persistent cart with size selection and automatic discount handling.
- **Validated checkout**: Order flow with support for delivery and pickup.
- **Admin dashboard**: Protected interface for managing menu categories, products, orders, and site settings.
- **Email notifications**: Instant order notifications to the restaurant via Resend API.
- **Type‑safe development**: From database to UI using `sqlc` and TypeScript.

---

## Architecture

The project is built as a **decoupled monorepo**:

### [Frontend](./frontend) (Next.js 16)

- **App Router**: Server and Client components for efficient rendering.
- **State management**: Zustand for lightweight and persistent state.
- **Styling**: Tailwind CSS 4 for a responsive design system.

### [Backend](./backend) (Go 1.22+)

- **API**: Go REST API using the Chi router.
- **Database**: PostgreSQL with `sqlc` for compile‑time safe SQL queries.
- **Security**: JWT authentication and bcrypt password hashing.

---

## Documentation

Comprehensive technical documentation is located in the [**/docs**](./docs) directory:

- [**System Architecture**](./docs/ARCHITECTURE.md) – High‑level stack overview, component diagrams, and data flow.
- [**API Specification**](./docs/API_SPECIFICATION.md) – Detailed endpoint documentation, request/response schemas, and error handling.
- [**OpenAPI Specification**](./docs/openapi.yaml) – Machine‑readable API definition (Swagger).
- [**Database Schema**](./docs/DATABASE_SCHEMA.md) – Table structures, ER diagram, and migration guidelines.
- [**Authentication & Security**](./docs/AUTHENTICATION.md) – JWT flow, security considerations, and best practices.
- [**Frontend Internals**](./docs/FRONTEND_INTERNALS.md) – Next.js patterns, component hierarchy, and state management.
- [**Backend Internals**](./docs/BACKEND_INTERNALS.md) – Go implementation, concurrency, and testing.
- [**Deployment Guide**](./docs/DEPLOYMENT.md) – Docker orchestration, CI/CD, monitoring, and scaling.

---

## Run Local

### Prerequisites

- **Node.js** 20.x+
- **Go** 1.22+
- **Docker** & Docker Compose
- **PostgreSQL** 16 (or run via Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/your‑org/vivanapoli.git
cd vivanapoli
```

### 2. Backend Setup

```bash
cd backend
cp .env-example .env
# Edit .env with your configuration (see Environment Variables below)
docker-compose up -d postgres
make migrate-up
make seed
make server
```

The API will be available at `http://localhost:8080`.

### 3. Frontend Setup

```bash
cd frontend
cp .env-example .env.local
# Edit .env.local: NEXT_PUBLIC_API_URL=http://localhost:8080/api
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### 4. Admin Access

Navigate to `http://localhost:3000/admin` and log in with the default credentials:

- **Email**: `admin@vivanapoli.no`
- **Password**: `admin123`

---

## Environment Variables

### Backend (`.env`)

| Variable           | Description                            | Required |
| ------------------ | -------------------------------------- | -------- |
| `PORT`             | Port the Go server listens on          | Yes      |
| `ALLOWED_ORIGINS`  | Comma‑separated CORS origins           | Yes      |
| `DB_URL`           | PostgreSQL connection string           | Yes      |
| `JWT_SECRET`       | Secret for signing JWTs (min 32 chars) | Yes      |
| `RESEND_API_KEY`   | Resend API key for email notifications | Yes      |
| `ORDER_EMAIL_TO`   | Restaurant owner notification email    | Yes      |
| `ORDER_EMAIL_FROM` | Verified sender email in Resend        | Yes      |

### Frontend (`.env.local`)

| Variable              | Description               | Required |
| --------------------- | ------------------------- | -------- |
| `NEXT_PUBLIC_API_URL` | Base URL for API requests | Yes      |

---

## Testing

### Backend

```bash
cd backend
go test ./...               # unit tests
INTEGRATION=1 go test ./... # integration tests (requires running PostgreSQL)
```

### Frontend

```bash
cd frontend
npm run test                # run Vitest tests
npm run test:watch          # watch mode
```

---

## Deployment

The application is containerized and ready for production. Refer to the [**Deployment Guide**](./docs/DEPLOYMENT.md) for detailed instructions on:

- Building production Docker images
- Configuring Nginx reverse proxy and SSL
- Setting up CI/CD with GitHub Actions
- Monitoring, backups, and scaling

---

_Last updated: April 2026_
