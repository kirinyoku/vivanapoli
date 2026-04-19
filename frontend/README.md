# Viva Napoli - Frontend

Modern, high-performance web application for the Viva Napoli pizzeria, built with Next.js 16 and Tailwind CSS.

## Tech Stack

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **State Management:** [Zustand](https://docs.pmnd.rs/zustand/)
- **Icons:** Lucide React
- **Testing:** Vitest & React Testing Library
- **Linting/Formatting:** ESLint & Prettier

## Detailed Documentation

For in-depth technical details, please refer to the following:

- [Frontend Internals](../docs/FRONTEND_INTERNALS.md) — Architecture, stores, and patterns.
- [Authentication](../docs/AUTHENTICATION.md) — Admin portal protection and JWT handling.
- [API Specification](../docs/API_SPECIFICATION.md) — Backend interaction details.
- [System Architecture](../docs/ARCHITECTURE.md) — High-level data flow.
- [OpenAPI Specification](../docs/openapi.yaml) — Machine‑readable API definition (Swagger/OpenAPI 3.0).

## API Documentation (OpenAPI)

The backend API is fully described by an OpenAPI 3.0 specification located at [`docs/openapi.yaml`](../docs/openapi.yaml). Frontend developers can leverage this machine‑readable definition to:

- Generate a fully typed TypeScript client for seamless integration.
- Explore endpoints, request/response schemas, and authentication requirements interactively.
- Validate API contracts during development to prevent mismatches.

### Generating a TypeScript Client

To generate a TypeScript client with `openapi‑typescript‑codegen`:

```bash
npx openapi-typescript-codegen --input docs/openapi.yaml --output ./src/lib/api-client --client fetch
```

The generated client will provide typed methods for every endpoint, eliminating manual `fetch` calls and improving type safety.

### Interactive Documentation

You can view the OpenAPI specification using Swagger UI or Redoc:

1. **Online Swagger Editor** – Paste the contents of `docs/openapi.yaml` into [Swagger Editor](https://editor.swagger.io/).
2. **Local Redoc** – Generate a static HTML page:

   ```bash
   npx @redocly/cli build-docs docs/openapi.yaml --output openapi.html
   ```

3. **IDE Integration** – Use OpenAPI plugins in VS Code (e.g., "OpenAPI (Swagger) Editor") to preview the spec side‑by‑side with your code.

### Using the Generated Client

After generating the client, import it in your components:

```typescript
import { DefaultApi } from './src/lib/api-client';

const api = new DefaultApi();
const menu = await api.getMenu(); // Fully typed response
```

---

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm (comes with Node.js)

### 1. Environment Configuration

Create a `.env.local` file in this directory and point it to your backend API:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080/api
```

### 2. Installation

```bash
npm install
```

### 3. Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## Scripts

| Command          | Description                                |
| :--------------- | :----------------------------------------- |
| `npm run dev`    | Start development server with hot-reload   |
| `npm run build`  | Build the application for production       |
| `npm run start`  | Start the production server (after build)  |
| `npm run lint`   | Run ESLint to check code quality           |
| `npm run test`   | Run unit and integration tests with Vitest |
| `npm run format` | Format code using Prettier                 |

## Project Structure

- `app/` — Next.js App Router (pages, layouts, and API routes).
  - `admin/` — Protected management dashboard.
  - `checkout/` — Customer order flow.
- `components/` — React components.
  - `ui/` — Atomic UI elements (Buttons, Badges, etc.).
  - `admin/` — Admin-specific complex components (Modals).
- `store/` — Zustand state stores (Cart, Navigation).
- `lib/` — Shared utilities, API client, and business logic (Opening hours).
- `types/` — TypeScript interfaces and enums.
- `public/` — Static assets (SVGs, Icons).

## Admin Portal

The dashboard is located at `/admin`. It requires a valid JWT token stored in `localStorage` as `viva-admin-token`. Unauthorized access attempts are automatically redirected to `/admin/login`.

## Deployment

The frontend is designed to be deployed as a standard Next.js application. Refer to the [Deployment Guide](../docs/DEPLOYMENT.md) for production configuration.
