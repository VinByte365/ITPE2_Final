# Systems Index

The ITPE final project of **BSIT-NS-3A at TUP Taguig** — sixteen modules on the
hardware, software, and platforms that run modern computing.

The project now has two parts:

- **`src/`** — the React 19 + Vite public site. It renders the module index,
  module detail pages, video tabs, summaries, and the class roster.
- **`server/`** — an Express 5 API backed by **Supabase Postgres** and
  **Supabase Auth**. It owns the content, validation, search, roles, and
  publishing rules.

The public site reads from the API at runtime. If the API is unavailable or has
not been configured yet, the site falls back to the bundled seed content in
`src/data/modules.js`, so the static site never goes blank.

## Stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, React Router 7, Vite |
| API | Node.js, Express 5, Zod, `pg` |
| Database | Supabase Postgres |
| Auth | Supabase Auth (email/password) + role checks |
| Security | Helmet, CORS allow-list, HttpOnly cookies, rate limits, RLS |

## Scripts

```bash
npm run dev          # Vite frontend only (uses API if available, bundled data otherwise)
npm run dev:api      # Express API with --watch, http://localhost:4000
npm run dev:all      # Both frontend and API
npm run build        # Production frontend build
npm run lint         # ESLint
npm run server       # Start the API without watch mode
npm run db:schema    # Apply server/db/schema.sql to Supabase
npm run db:migrate   # Apply pending files in server/db/migrations/ (run after db:schema)
npm run db:seed      # Seed the 16 modules, presenters, and videos
npm run make:admin   # Promote an existing Supabase Auth user to admin
```

On Windows PowerShell, use `npm.cmd` if your execution policy blocks `npm`.

## Environment

Copy the example file:

```bash
cp .env.example .env
```

Then fill in every placeholder. `.env` is git-ignored.

### Supabase credentials

| Variable | Where to find it | Used by |
| --- | --- | --- |
| `SUPABASE_URL` | Dashboard → Project Settings → API | Auth + server |
| `SUPABASE_ANON_KEY` | Dashboard → Project Settings → API | Auth sign-in/refresh |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Project Settings → API | Server-side token verification |
| `DATABASE_URL` | Dashboard → Connect → Connection string → URI | Postgres API, schema, seed |

The `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` must **never** be exposed to
the frontend. Only `VITE_API_BASE_URL` is available to Vite.

The Postgres connection string should use the **Session pooler** (port `5432`)
for schema/seed work and this long-lived API. If you deploy the API to a
serverless environment, you may need the transaction pooler (port `6543`)
instead.

### Other variables

| Variable | Default | Notes |
| --- | --- | --- |
| `PORT` | `4000` | API port |
| `HOST` | `0.0.0.0` | API bind address |
| `NODE_ENV` | `development` | Use `production` on a server |
| `CORS_ORIGIN` | local Vite origins | Comma-separated exact origins |
| `TRUST_PROXY` | `false` | Set `true` behind Render/Railway/NGINX |
| `COOKIE_SECURE` | `false` in dev | Must be `true` in production |
| `COOKIE_SAME_SITE` | `lax` | Use `none` for a cross-site frontend |
| `PASSWORD_RESET_REDIRECT_URL` | local Vite URL | Supabase email redirect |
| `VITE_API_BASE_URL` | `/api/v1` | Frontend API base |

If the frontend and API are on different sites, set:

```env
COOKIE_SAME_SITE=none
COOKIE_SECURE=true
CORS_ORIGIN=https://your-frontend.example
VITE_API_BASE_URL=https://your-api.example/api/v1
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env` and replace the Supabase placeholders.
3. Apply the schema:

   ```bash
   npm run db:schema
   ```

   You can also paste `server/db/schema.sql` into the Supabase SQL Editor.

4. Seed the current class content:

   ```bash
   npm run db:seed
   ```

5. In **Supabase Dashboard → Authentication → Users**, add your admin user with
   an email and password. Confirm the email if confirmation is enabled. The
   database trigger creates a `profiles` row with the `viewer` role.
6. Promote the account:

   ```bash
   npm run make:admin -- you@example.com
   ```

7. Start both apps:

   ```bash
   npm run dev:all
   ```

   - Site: `http://localhost:5173`
   - API health: `http://localhost:4000/health`

## Roles

| Role | Access |
| --- | --- |
| `viewer` | Can sign in and read their own profile; no admin API access |
| `editor` | Read/write modules, presenters, videos, and publish states |
| `admin` | Everything an editor can do, plus hard deletes and profile roles |

Admin API access requires a Supabase Auth access token, sent either as the
HttpOnly cookie created by `POST /api/v1/auth/login` or as
`Authorization: Bearer <token>`.

## API

See [`docs/API.md`](docs/API.md) for the full endpoint list and request bodies.
The short version:

```text
GET    /api/v1/content
GET    /api/v1/modules
GET    /api/v1/modules/:idOrSlug
GET    /api/v1/themes
GET    /api/v1/presenters
GET    /api/v1/stats
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
GET    /api/v1/auth/me
POST   /api/v1/auth/forgot-password

GET    /api/v1/admin/modules
POST   /api/v1/admin/modules
GET    /api/v1/admin/modules/:id
PATCH  /api/v1/admin/modules/:id
DELETE /api/v1/admin/modules/:id
PUT    /api/v1/admin/modules/:id/presenters
POST   /api/v1/admin/modules/:id/videos
PATCH  /api/v1/admin/modules/:id/videos/:videoId
DELETE /api/v1/admin/modules/:id/videos/:videoId
GET    /api/v1/admin/presenters
POST   /api/v1/admin/presenters
PATCH  /api/v1/admin/presenters/:id
DELETE /api/v1/admin/presenters/:id
GET    /api/v1/admin/profiles
PATCH  /api/v1/admin/profiles/:id
```

## Business rules

- Public endpoints only ever return `published` modules, even if a caller passes
  `status`.
- A module can be published only when it has at least one presenter.
- Slugs are generated from titles and made unique automatically.
- Deleting a module archives it by default; `?hard=true` permanently deletes it
  and requires the `admin` role.
- A presenter attached to a published module cannot be deleted until removed
  from that module.
- The last admin cannot be demoted, and admins cannot remove their own access.
- Videos and presenter links are ordered by `position`.
- Row-level security policies mirror the public/editor split as a second layer
  of protection.

## LMS work in progress

The `docs/lms/` folder contains the in-progress plan, agent rules, decisions, specs and
checklists for repurposing this site into a small LMS (faculty create subjects/topics/quizzes;
students join with a code and progress by passing). See [`docs/lms/README.md`](docs/lms/README.md).

## Deployment notes

- Build the frontend with `VITE_API_BASE_URL` pointing at the deployed API.
- Deploy `server/` as a Node service (Render, Railway, Fly.io, a VPS, etc.) and
  set every server variable there.
- Set `NODE_ENV=production`, `COOKIE_SECURE=true`, `TRUST_PROXY=true`, and the
  exact `CORS_ORIGIN` for the deployed frontend.
- The existing `vercel.json` still serves the SPA. It does not host the API; the
  API needs its own Node process unless you add a serverless adapter.
- `npm run deploy` still publishes the static build to GitHub Pages, but that
  deployment has no API and will use the bundled fallback content.

## Content source

The 16 modules, 32 presenters, slide links, videos, summaries, and themes live in
`src/data/modules.js`. That file is the seed source and the offline fallback.
