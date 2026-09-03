# Mini-Product-Store-API
A small end-to-end backend app where users sign up, browse products, pay for one with Stripe, and get emails along the way.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ESM) |
| Language | TypeScript 7 |
| Framework | Express 5 |
| Database | PostgreSQL (via `pg` driver) |
| ORM | Drizzle ORM + Drizzle Kit |
| Validation | Zod 4 |
| Auth | JSON Web Tokens (`jsonwebtoken`) + bcryptjs |
| Payments | Stripe via `stripe` SDK |
| Email | Brevo (formerly Sendinblue) via `@getbrevo/brevo` |
| Templating | EJS (for email HTML) |
| Logging | Winston |
| Caching | Redis (scaffolded, currently commented out) |
| Testing | Vitest + Supertest |

#   Prerequisites

- **Node.js** ≥ 22 (uses `process.loadEnvFile`, native ESM, `--env-file` flag)
- **PostgreSQL** – A running PostgreSQL instance (local or remote)
- **Redis** *(optional)* – Required only if you enable the Redis caching layer (currently commented out)
- **npm**
- A **Brevo account** with an API key for transactional emails
- A **Stripe account** with a secret key for payment processing

#   Installation

```bash
# 1. Clone the repository
git clone https://github.com/MaxKolbe/Mini-Product-Store-API.git
cd Mini-Product-Store-API

# 2. Install dependencies
npm install
```

#   Environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Environment mode (`development`, `production`, or `test`) | `development` |
| `PORT` | Port the server listens on | `3000` |
| `PG_DATABASE_PROD_URL` | PostgreSQL connection string for production (use `?sslmode=verify-full`) | `postgresql://user:password@dpg-host.com/database?sslmode=verify-full` |
| `PG_DATABASE_DEV_URL` | PostgreSQL connection string for development | `postgresql://user:password@localhost:5432/mini_store_dev` |
| `PG_DATABASE_TEST_URL` | PostgreSQL connection string for test database | `postgresql://user:password@localhost:5432/mini_store_test` |
| `REDIS_PROD_URL` | Redis URL for production *(optional, currently unused)* | `redis://...` |
| `REDIS_DEV_URL` | Redis URL for development *(optional, currently unused)* | `redis://localhost:6379` |
| `REDIS_TEST_URL` | Redis URL for test *(optional, currently unused)* | `redis://localhost:6379` |
| `REDIS_HOST` | Redis host *(optional)* | `127.0.0.1` |
| `REDIS_PORT` | Redis port *(optional)* | `6379` |
| `REDIS_USERNAME` | Redis username *(optional)* | |
| `REDIS_PASSWORD` | Redis password *(optional)* | |
| `LOG_LEVEL` | Winston log level (`error`, `warn`, `info`, `http`, `verbose`, `debug`, `silly`) | `http` |
| `JWT_SECRET` | Secret key used to sign and verify JWTs | *any strong random string* |
| `BREVO_API_KEY` | API key from your Brevo account | `xkeysib-...` |
| `BREVO_EMAIL` | Sender email address registered in Brevo | `noreply@example.com` |
| `STRIPE_SECRET_KEY` | Secret key from your Stripe dashboard | `sk_test_...` |
| `API_BASE_URL` | Base URL of the running API (used for Stripe success/cancel redirect URLs) | `http://localhost:3000/` |

#   Database setup/migrations

The project uses **Drizzle ORM** with PostgreSQL. The database schema is defined in `src/db/models/` and migrations are output to `drizzle/`.

```bash
# 1. Install the uuid-ossp extension and seed test data
#    (clears tables, installs extensions, inserts user@example.com / SecurePass1 and 4 products)
npm run db:seed

# 2. Generate migrations from the Drizzle schema
npm run db:generate

# 3. Apply migrations to the database
npm run db:migrate

# 4. (Optional) Open Drizzle Studio to browse your database
npm run db:studio
```

### Database schema

**`users`** table:

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | Primary key, auto-generated (`uuid_generate_v4()`) |
| `email` | `text` | Not null, unique |
| `password` | `text` | Not null (bcrypt hash) |
| `updated_at` | `timestamp` | Nullable |
| `created_at` | `timestamp` | Not null, defaults to `now()` |
| `deleted_at` | `timestamp` | Nullable (soft delete) |

**Indexes:** `user_email_idx` on `email`, `user_createdat_idx` on `created_at`.

**`products`** table:

| Column | Type | Constraints |
|---|---|---|
| `id` | `uuid` | Primary key, auto-generated (`uuid_generate_v4()`) |
| `name` | `text` | Not null |
| `description` | `text` | Not null |
| `price` | `integer` | Not null (stored in minor currency units, e.g. kobo) |
| `updated_at` | `timestamp` | Nullable |
| `created_at` | `timestamp` | Not null, defaults to `now()` |
| `deleted_at` | `timestamp` | Nullable (soft delete) |

**Indexes:** `products_name_idx` on `name`, `products_desc_idx` on `description`, `products_price_idx` on `price`, `products_createdat_idx` on `created_at`.

#   Running locally

```bash
# Development mode (hot-reload via tsx watch, reads .env automatically)
npm run dev

# Production build
npm run build    # installs deps + compiles TypeScript to dist/
npm start        # runs dist/index.js
```

The server starts on the port defined by `PORT` (defaults to `3000`).

#   API endpoints

Base URL: `http://localhost:3000`

### Auth

#### `POST /api/auth/register`

Register a new user. Sends a welcome email on success.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "Secure1234"
}
```

**Validation rules:**
- `email` – must be a valid email; automatically lowercased and trimmed
- `password` – 8–128 characters, must contain at least one uppercase letter and one number

**Success response (`200`):**
```json
{
  "success": true,
  "message": "user created successfully",
  "data": {
    "id": "a1b2c3d4-...",
    "email": "user@example.com",
    "createdAt": "2026-09-02T12:00:00.000Z"
  },
  "meta": {
    "correlationId": "uuid-..."
  }
}
```

**Error responses:**

| Status | Code | Condition |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Missing/invalid email or password |
| `409` | `CONFLICT` | Email already exists |

---

#### `POST /api/auth/login`

Log in with existing credentials. Returns a JWT on success.

**Request body:**
```json
{
  "email": "user@example.com",
  "password": "Secure1234"
}
```

**Success response (`201`):**
```json
{
  "success": true,
  "message": "user logged in successfully",
  "data": {
    "id": "a1b2c3d4-...",
    "email": "user@example.com"
  },
  "meta": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "correlationId": "uuid-..."
  }
}
```

**Error responses:**

| Status | Code | Condition |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Invalid credentials (wrong email or password) or missing/invalid fields |

> Both wrong-email and wrong-password return the same generic `"Invalid credentials"` message to prevent user enumeration.

---

### Products

#### `GET /api/products`

Retrieve a paginated list of products. **No authentication required.**

**Query parameters:**

| Parameter | Type | Default | Constraints |
|---|---|---|---|
| `page` | `number` | `1` | Minimum: 1 |
| `limit` | `number` | `25` | Min: 1, Max: 100 |
| `orderBy` | `string` | `"desc"` | `"asc"` or `"desc"` (sorts by `created_at`) |
| `search` | `string` | — | Optional. Case-insensitive match on product `name` or `description` |

**Success response (`200`):**
```json
{
  "success": true,
  "message": "products retrieved successfully",
  "data": [
    {
      "id": "305fe4da-...",
      "name": "Wireless Mechanical Keyboard",
      "description": "Compact RGB wireless mechanical keyboard with tactile switches.",
      "price": 89999,
      "createdAt": "2026-09-03T12:00:00.000Z",
      "updatedAt": null,
      "deletedAt": null
    }
  ],
  "meta": {
    "correlationId": "uuid-...",
    "pagination": {
      "page": 1,
      "limit": 25,
      "totalRecords": 4,
      "totalPages": 1,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

**Error responses:**

| Status | Code | Condition |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Invalid query params (e.g., `page` < 1, `limit` > 100) |

---

### Checkout

#### `POST /api/checkout`

Create a Stripe Checkout Session for one or more products. **Requires authentication** (JWT in `accesstoken` cookie).

**Request body:**
```json
{
  "products": [
    {
      "productId": "305fe4da-8bc4-449e-b566-ebbb5a065a4d",
      "quantity": 2
    }
  ]
}
```

**Validation rules:**
- `products` – array with at least 1 item
- `products[].productId` – must be a valid UUID
- `products[].quantity` – must be a positive integer

**Success response (`200`):**
```json
{
  "success": true,
  "message": "checkout session created successfully",
  "data": {
    "url": "https://checkout.stripe.com/c/pay/cs_test_..."
  },
  "meta": {
    "correlationId": "uuid-..."
  }
}
```

The `data.url` is a Stripe-hosted checkout page. Redirect the user to this URL to complete payment.

**Error responses:**

| Status | Code | Condition |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Empty products array, invalid UUID, or non-positive quantity |
| `401` | `UNAUTHORIZED` | Missing, expired, or invalid JWT token |

---

#### `GET /api/checkout`

Placeholder success callback endpoint. Stripe redirects here after a successful payment.

**Success response (`200`):**
```json
{
  "success": true,
  "message": "payment made successfully",
  "data": null
}
```

---

#### Unknown routes

Any request to an undefined route returns:

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Route /some/path not found"
  }
}
```

### Correlation ID

Every request is assigned a unique correlation ID (UUID). You can also supply your own via the `x-correlation-id` request header. The correlation ID is:
- Echoed back in the `x-correlation-id` response header
- Included in the `meta.correlationId` field of success responses
- Attached to all log entries for the request

#   How authentication works

1. **Registration** – The user's password is hashed with **bcryptjs** (10 salt rounds) before being stored in the `users` table.

2. **Login** – The submitted password is compared against the stored hash using `bcrypt.compare`. On success, a **JWT** is generated containing the user's `id` as the `sub` claim and `email`, signed with `JWT_SECRET`, and set to expire in **20 minutes**. The token is returned in the response body under `meta.token` and set in the browser's cookie-jar as `accesstoken`.

3. **Protected routes** – The `authenticate` middleware reads a JWT from the `accesstoken` cookie, verifies it with `jsonwebtoken`, and attaches `req.user = { id, email }` to the request. It throws `UnauthorizedError` for missing, expired, or invalid tokens. Currently used by the `POST /api/checkout` route.

4. **Error classes** – The app defines structured error classes (`ValidationError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`, `ConflictError`) that extend a base `AppError`. The global error handler middleware catches these and returns consistent JSON error responses with `status`, `error.code`, and `error.message`.

#   How Brevo is integrated

The email system uses the **Brevo transactional email API** (`@getbrevo/brevo` SDK):

1. **Configuration** – A `BrevoClient` is instantiated in `src/utils/sendEmail.util.ts` with the `BREVO_API_KEY` environment variable. The sender email is read from `BREVO_EMAIL`.

2. **Email rendering** – Email HTML is built using **EJS templates** in `src/views/`:
   - `template.ejs` – The outer HTML wrapper (layout with title and styled container)
   - `welcome.ejs` – The welcome email content, greeting the user by the local part of their email address

3. **Sending flow** – When a user registers, the auth service emits an `auth:signup` event via Node's `EventEmitter`. The listener in `src/events/auth.events.ts` renders the welcome template and calls `sendEmail()`, which sends the transactional email through Brevo's `sendTransacEmail` API.

4. **Error handling** – The email utility handles Brevo-specific errors (401 invalid API key, 429 rate limiting, and general `BrevoError` instances), logging each with Winston. Email failures do **not** cause the registration request to fail — they are handled asynchronously in the event listener.

5. **Auth events** – Three events are defined:
   - `auth:signup` → sends welcome email + logs
   - `auth:login` → logs successful login
   - `auth:login-fail` → logs failed login attempt with reason

#   How to test registration/login

### Using cURL

**Register:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "MyPass123"}'
```

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "MyPass123"}'
```

### Using Bruno

The project includes Bruno API collection files in `src/docs/api-docs/` with pre-configured requests for the `register`, `login`, `list products`, and `checkout` endpoints. Open the collection folder in [Bruno](https://www.usebruno.com/) to send requests interactively.

### Integration tests

Integration tests are in `src/tests/auth.integration.test.ts` (currently commented out). They cover:
- Successful registration and login
- Duplicate email detection (case-insensitive)
- Input validation (missing fields, email format, password constraints)
- Correlation ID propagation
- Consistent error shapes to prevent user enumeration
- 404 for wrong HTTP methods

The test setup uses **Vitest** with **Supertest**, connects to the `PG_DATABASE_TEST_URL` database, and clears tables between tests. Configuration is in `src/configs/vitest.config.ts`.
