## Frontend (React + Vite)

This directory contains the SPA responsible for the user-facing experience. It consumes the Rails API, handles routing/auth state, renders the admin dashboard and profile flows, and keeps the UI updated with realtime events.

## Responsibilities

- Authentication UI (login, registration) with JWT persistence.
- Role-aware routing (`react-router-dom`) and guards.
- Admin dashboard with pagination, CRUD, role toggling and bulk import progress via Action Cable.
- Profile editing (including avatar upload preview/modals).
- Bootstrap 5 styling extended with custom SCSS.

## Running the app

### Via Docker (recommended)

```bash
cd frontend
docker compose up --build
```

This starts the Vite dev server on `http://localhost:5173` with hot reload, using the backend at `http://localhost:3000`. Tests stay isolated under the `test` profile:

```bash
docker compose --profile test run --rm test
```

### Manual setup

Requirements: Node.js 18+, npm 9+.

```bash
cd frontend
npm install
npm run dev
```

The dev server listens on `http://localhost:5173`. Ensure the backend API is reachable at `http://localhost:3000` or adjust the env vars below.

## Environment variables

Create `.env.local` or `.env` with:

```
VITE_API_BASE_URL=http://localhost:3000
VITE_CABLE_URL=ws://localhost:3000/cable
```

If omitted, the app falls back to `http://localhost:3000` and derives the Cable URL automatically.

## Scripts

- `npm run dev` – start Vite dev server.
- `npm run build` – production bundle.
- `npm run preview` – preview the production build.
- `npm run test` – run Vitest suite.

## Testing

Vitest + Testing Library are configured with JSDOM. Coverage thresholds are enforced; keep the suite green before pushing changes.

```bash
npm run test
```

## Router & Pages

| Path                | Component                 | Description                                                                 |
|---------------------|---------------------------|-----------------------------------------------------------------------------|
| `/`                 | `HomeRedirect`            | Redirects authenticated users to `/admin` (admins) or `/profile` (standard) |
| `/login`            | `LoginPage`               | Login form                                                                  |
| `/register`         | `RegisterPage`            | Registration form                                                           |
| `/profile`          | `ProfilePage`             | Read-only profile summary                                                   |
| `/profile/edit`     | `ProfileEditPage`         | Profile editing form                                                        |
| `/admin`            | `AdminDashboardPage`      | Admin dashboard (user list, counters, import progress)                      |
| `/admin/users/new`  | `AdminCreateUserPage`     | Admin-only user creation page                                               |
| `/admin/users/:id/edit` | `AdminEditUserPage`  | Admin-only user editing page                                                |
| `*`                 | `NotFoundPage`            | Fallback for unknown routes                                                 |

Protected routes require an authenticated user; admin routes additionally check `role === 'admin'`.

