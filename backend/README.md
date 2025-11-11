# Backend (Rails API)

This Rails application exposes the REST API, authentication flow and background processing used by the Umanni Users dashboard. It also publishes realtime updates (Action Cable) consumed by the frontend.

## Responsibilities

- User registration, login and JWT issuance.
- Admin endpoints for listing, creating, updating, deleting and bulk-importing users.
- Role-based rules and real-time counters via Redis + Action Cable.
- Active Storage support for avatar uploads.
- Seeds with default admin/user accounts (`db/seeds.rb`).

## Running the API

### Via Docker (recommended)

```bash
cd backend
docker compose up --build
```

This launches:

- `app`: Rails server on `http://localhost:3000`
- `sidekiq`: background worker
- `db`: PostgreSQL 15
- `redis`: Redis 7

Seeds run automatically on first boot. To run the test suite:

```bash
docker compose --profile test run --rm test
```

### Manual setup (optional)

Requirements: Ruby 3.3.x, PostgreSQL 15, Redis 7, Node.js.

```bash
cd backend
bundle install
rails db:setup
rails server # http://localhost:3000
```

Run Sidekiq separately with:

```bash
bundle exec sidekiq -C config/sidekiq.yml
```

Tests:

```bash
bundle exec rspec
```

## Handy tasks

- `bundle exec rake db:reset_with_seeds` – drops/recreates the database and reloads seeds.
- `bundle exec rails db:seed` – idempotently refreshes default users.

## Environment variables

See `.env.example` for a starter list. Common keys:

- `DATABASE_URL`
- `REDIS_URL`
- `JWT_SECRET`
- `RAILS_MASTER_KEY`

## Key Endpoints

All responses are JSON. Unless specified, endpoints require authentication via `Authorization: Bearer <token>`.

### Auth

| Method | Path        | Description                      |
|--------|-------------|----------------------------------|
| POST   | `/register` | Register user, returns JWT       |
| POST   | `/login`    | Authenticate user, returns JWT   |

**Request bodies**

- `/register`
  ```json
  {
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "password": "password123",
    "avatar_image": "<optional multipart file>"
  }
  ```
- `/login`
  ```json
  {
    "email": "jane@example.com",
    "password": "password123"
  }
  ```

**Response (201/200)**

```json
{ "token": "jwt-token-string" }
```

### Current user

| Method | Path  | Description                |
|--------|-------|----------------------------|
| GET    | `/me` | Fetch current user profile |
| PUT    | `/me` | Update profile (name/email/password/avatar) |
| DELETE | `/me` | Delete current account      |

**Request body (`PUT /me`)**

```json
{
  "user": {
    "full_name": "New Name",
    "email": "new@example.com",
    "password": "newpassword",
    "avatar_image": "<optional multipart file>"
  }
}
```

**Response example**

```json
{
  "id": 42,
  "full_name": "New Name",
  "email": "new@example.com",
  "role": "non_admin",
  "avatar_image_url": "http://localhost:3000/rails/active_storage/blobs/.../avatar.png",
  "created_at": "2025-11-11T20:00:00Z",
  "updated_at": "2025-11-11T20:10:00Z"
}
```

### Admin

All prefixed with `/admin` and require user `role: admin`.

| Method | Path             | Description                                     |
|--------|------------------|-------------------------------------------------|
| GET    | `/users`         | Paginated list with counts                      |
| GET    | `/users/:id`     | Fetch specific user                             |
| POST   | `/users`         | Create user (full name, email, password, role)  |
| PUT    | `/users/:id`     | Update user (partial)                           |
| DELETE | `/users/:id`     | Delete user                                     |
| POST   | `/users/bulk`    | Upload CSV/XLS/XLSX for background import       |
| GET    | `/cable`         | Action Cable websocket (used by frontend)       |

**Request bodies**

- `POST /admin/users`
  ```json
  {
    "full_name": "Alice Admin",
    "email": "alice@example.com",
    "password": "password123",
    "role": "admin",
    "avatar_image": "<optional multipart file>"
  }
  ```
- `PUT /admin/users/:id`
  ```json
  {
    "user": {
      "full_name": "Updated Name",
      "role": "non_admin"
    }
  }
  ```
- `POST /admin/users/bulk` (multipart form)
  ```
  file=users.xlsx
  ```

**Response examples**

- `GET /admin/users`
  ```json
  {
    "users": [
      {
        "id": 1,
        "full_name": "Administrador Padrão",
        "email": "admin@example.com",
        "role": "admin",
        "avatar_image_url": null,
        "created_at": "2025-11-11T18:00:00Z",
        "updated_at": "2025-11-11T18:00:00Z"
      }
    ],
    "users_count": {
      "non_admin": 1,
      "admin": 1,
      "total": 2
    },
    "pagination": {
      "page": 1,
      "per_page": 20,
      "total_pages": 1,
      "total_count": 2
    }
  }
  ```
- `POST /admin/users`
  ```json
  {
    "id": 3,
    "full_name": "Alice Admin",
    "email": "alice@example.com",
    "role": "admin",
    "avatar_image_url": null,
    "created_at": "2025-11-11T20:15:00Z",
    "updated_at": "2025-11-11T20:15:00Z"
  }
  ```
- `POST /admin/users/bulk`
  ```json
  {
    "import_id": "a8c4f7d6-bulk-job-id",
    "actor_id": "1",
    "status": "queued"
  }
  ```

Bulk import progress is streamed over Action Cable (`BulkImportChannel`); user counts over `UsersCountChannel`.
