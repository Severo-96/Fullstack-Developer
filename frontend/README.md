## Frontend Application

This directory hosts the React (Vite + TypeScript) frontend for the Umanni users management challenge.  
The UI consumes the Rails backend located in `../backend`.

### Requirements

- Node.js 18 or later
- npm 9+

### Quick Start

```bash
cd frontend
npm install
npm run dev
```

The dev server runs on http://localhost:5173 by default. Configure the backend URL through environment variables (see below).

### Environment Variables

Create a `.env.local` file (or `.env`) with the variables you need. Common keys:

```
VITE_API_BASE_URL=http://localhost:3000
VITE_CABLE_URL=ws://localhost:3000/cable
```

When omitted, the app defaults to `http://localhost:3000` for the API and infers the Action Cable URL from the current window location.

### Available Scripts

- `npm run dev` – run the Vite dev server.
- `npm run build` – create an optimized production build.
- `npm run preview` – preview the production build locally.
- `npm run test` – run the Vitest suite with coverage.

### Features

- JWT-based authentication (login/register) with persisted sessions.
- Role-based routing (admin dashboard vs. profile).
- Admin dashboard that supports:
  - realtime user counters via Action Cable
  - CRUD actions and role toggling
  - bulk CSV/XLS/XLSX imports with live progress
- Profile management for any authenticated user (update info, avatar, password, delete account).
- Bootstrap 5 styling with custom SCSS extensions.

### Testing

Vitest is configured with JSDOM and Testing Library helpers. Coverage thresholds are enforced; add tests for new code paths to keep the suite green.

```bash
npm run test
```

