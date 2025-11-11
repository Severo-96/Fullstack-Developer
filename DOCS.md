## Overview

This repository contains a fullstack user management application:

- **Backend:** Ruby on Rails (`backend/`)
- **Frontend:** React + Vite (`frontend/`)

Both sides ship with Docker support, automated tests and database seeds with default credentials.

---

## Quick Start

### Requirements

- Docker >= 24
- Docker Compose >= 2.20

### Backend

```bash
cd backend
docker compose up --build
```

This starts:

- Rails API (`http://localhost:3000`)
- PostgreSQL (`localhost:5432`)
- Redis (`localhost:6379`)
- Sidekiq worker

On first boot the database is migrated and seeded automatically.

### Frontend

```bash
cd frontend
docker compose up --build
```

This runs Vite (`http://localhost:5173`) pointing to the API at `http://localhost:3000`.

---

## Running Tests

- **Backend**
  ```bash
  cd backend
  docker compose --profile test run --rm test
  ```

- **Frontend**
  ```bash
  cd frontend
  docker compose --profile test run --rm test
  ```

The `test` services are opt-in via Compose profiles, so they won't run during normal `up`.

---

## Resetting the Database (Backend)

Two options:

1. **One-off task (containers stopped):**
   ```bash
   cd backend
   docker compose down
   docker compose run --rm app bundle exec rake db:reset_with_seeds
   docker compose up
   ```

2. **While services run (stop app + sidekiq to release connections):**
   ```bash
   cd backend
   docker compose stop app sidekiq
   docker compose run --rm app bundle exec rake db:reset_with_seeds
   docker compose start app sidekiq
   ```

The task drops the database, recreates it, runs migrations and reloads `db/seeds.rb`.

---

## Default Credentials

Seeds create two users:

| Role  | Email               | Password |
|-------|---------------------|----------|
| Admin | `admin@example.com` | `admin123` |
| User  | `user@example.com`  | `user123`  |

Use these accounts to explore the admin dashboard and regular user flows.

---

## Notes

- Backend seeds and `db:reset_with_seeds` are idempotent.
- Frontend tests run with Vitest; backend tests use RSpec.
- Remember to rebuild images (`docker compose build`) whenever dependencies change (Gemfile, package.json, etc).

