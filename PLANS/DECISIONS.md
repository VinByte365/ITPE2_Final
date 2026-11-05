# Decisions, Facts and Open Questions

Status values: **confirmed** (the product owner said so) · **assumed** (reasonable default, change freely) ·
**changed** (was something else earlier; see notes). To overrule a decision, edit its row and add a line in
`HANDOFF-LOG.md`. Never delete a row.

## Decisions

| ID | Decision | Status | Notes |
| --- | --- | --- | --- |
| DEC-01 | Roles become `admin`, `faculty`, `student`. Migration maps `viewer`→`student`, `editor`→`faculty`. | assumed | Legacy `/admin/*` content routes become admin-only. |
| DEC-02 | Faculty self-registration creates an account with `approval_status = pending`; an admin must approve before faculty features work. | assumed | Prevents anyone claiming to be faculty. Students are auto-approved. |
| DEC-03 | Students register with first name, last name, student number (required, unique), email, password. | assumed | Surname and student number are needed for reports. |
| DEC-04 | A subject has a human **code** (e.g. `IT101`) and a separate generated **join code**. | assumed | "Code for students to join" read as the join code. |
| DEC-05 | Passing % is stored per subject, integer 1 to 100, default 75. UI offers 50 and 75 presets plus custom. | confirmed (50/75 changeable) | Presets and custom range are an assumption. |
| DEC-06 | Pass/fail is never stored. It is computed from score, total and the subject's current passing %. | confirmed | This is what makes X1 automatic. |
| DEC-07 | A topic's quiz is passed if **any** graded attempt passes. Reports show the **best** attempt. | assumed | |
| DEC-08 | Retakes are unlimited by default; a quiz may set `max_attempts`. | assumed | |
| DEC-09 | A submission waiting for manual grading (`pending_review`) does **not** unlock the next topic. | assumed | |
| DEC-10 | A topic opens at 00:00 (subject timezone, default `Asia/Manila`) on its `available_from` date. Each topic has its own date; the bulk generator fills dates from weekday patterns. | assumed | Holidays are handled by editing a topic's date. |
| DEC-11 | A topic with no published quiz is complete once the student opens it (`topic_progress`). | assumed | |
| DEC-12 | Sequencing considers only **published** topics, ordered by `position`. | assumed | Draft topics are invisible to students and skipped. |
| DEC-13 | Raising the passing % or publishing a quiz later can re-lock students who were already past it. | assumed | Faculty see a warning before saving. |
| DEC-14 | Text answers are graded by normalized exact match against a list of accepted answers (trim, collapse spaces, case-insensitive, Unicode NFKC). No per-answer manual override in v1. | changed | Earlier chat mentioned a faculty override. Replaced by "add accepted answer, then regrade" (DEC-15). |
| DEC-15 | Faculty may edit questions after attempts exist; scores update only when faculty press **Regrade**, which recomputes from stored raw answers. | assumed | |
| DEC-16 | A built-in quiz needs 10 to 20 questions **to publish**. Drafts may hold 0 to 20. Adding a 21st question is always rejected. | confirmed (10 to 20) | |
| DEC-17 | Uploaded quiz: student uploads **one image** showing their score; faculty type the score; total items is set by faculty. JPG/PNG/WebP up to 5 MB. Faculty may attach the quiz file (PDF/image/text) and/or an external link as instructions. | confirmed (flow) | File types and size are assumptions. |
| DEC-18 | File uploads use **signed upload URLs** issued by the API. | assumed | Auth tokens are HttpOnly, so the browser cannot call Supabase Storage with the user's session. |
| DEC-19 | Presentations: PDF (embedded), Google Slides link (embedded, as the old site did), or `.pptx` (download only). Max 25 MB. | assumed | Browsers cannot render `.pptx`. |
| DEC-20 | "Database upload" = CSV import of questions (template provided). Parsing happens in the browser; the API validates the payload. | assumed | Confirm with the product owner. |
| DEC-21 | Report average = mean of the **best %** of every published quiz whose topic has opened; missing quizzes count as 0. Overall remark = Passed if average ≥ passing %. | assumed | |
| DEC-22 | The legacy public site and `/content` API keep working until QA-08 decides their fate. | assumed | |
| DEC-23 | New tables use UUID primary keys and numbered migrations; legacy tables are untouched. | assumed | |
| DEC-24 | API runs as its own Node service. Prefer frontend and API on the same registrable domain (`app.x.edu` + `api.x.edu`) so `SameSite=Lax` works. Cross-site (`SameSite=None`) needs the origin guard (AUTH-11). | assumed | |
| DEC-25 | RLS is enabled with **no policies** on every new table. | assumed | Blocks access through Supabase's auto-generated REST API with the anon key. |
| DEC-26 | Server tests use Node's built-in runner (`node --test`); no extra test dependency. | assumed | |
| DEC-27 | Students never receive correct answers. `quizzes.show_answers` (default false) controls whether a graded result shows which of their answers were right. | assumed | |
| DEC-28 | Subjects are archived, never hard-deleted. A topic that has attempts cannot be deleted (unpublish it instead). | assumed | |
| DEC-29 | Notes and summaries are visible to students by default; a content block can be marked faculty-only (`visible_to_students = false`). | assumed | |
| DEC-30 | One faculty owner per subject (no co-teachers) in v1. | assumed | |
| DEC-31 | Phase 09 UI-03 is replaced by page-scoped tasks UI-06…UI-10. It covered six pages and 197 static `style={{}}` blocks, which is not reviewable as one diff. UI-04 (shared layout primitives) runs first so the page tasks can reuse real classes. | decided | |
| DEC-32 | `StatusBadge` renders a stamped mono label (2 px radius) rather than a pill, and carries state with icon + word + one token (`--accent-ink` attention, `--ink` neutral/done, `--muted` inactive). The palette has no semantic hues, so no green/amber/red is introduced. | decided | |
| DEC-33 | `PLANS/HANDOFF-LOG.md` is append-only at the byte level. It contains legacy non-UTF-8 bytes (raw `0xB7`), so a whole-file rewrite corrupts every historical entry. Agents must append; a diff with deletions on that file is a defect. | decided | |
| DEC-34 | Public-site wrapper hooks with no rules (`home`, `about-page`, `topics-page`, `hero-copy`, `about-hero-copy`, `presenter-list`, `gallery-main`, `course-map`, `nav-user`, `nav-logout`) are accepted as semantic landmarks, not drift — their children carry the styling. Only `markdown-view` (a content block with no typography at all) and `slides-embed` (inline iframe sizing) are real gaps and are fixed in UI-04. | decided | |
| DEC-35 | Report colour: failed uses symbol+text+accent-ink token only; red in PDF/Excel only with x symbol. | assumed | Matches RPT-07/08/09/12; DEC-32 no semantic hues. |

## Open questions (answer when known; defaults are in the table above)

| ID | Question | Default until answered |
| --- | --- | --- |
| OQ-01 | What is the product name and branding for the LMS? | Keep "Systems Index" internally; use "Class LMS" as placeholder text |
| OQ-02 | Is Supabase email confirmation enabled for sign-ups? | Assume enabled; register response tells the user to confirm email |
| OQ-03 | Where will the frontend and API be hosted (domains)? | Same-site assumed (DEC-24) |
| OQ-04 | Is a student number format enforced by the school? | Alphanumeric plus hyphen, 4 to 20 chars |
| OQ-05 | Is "Database upload" CSV import, or something else? | CSV import (DEC-20) |

## Facts to verify in HK-01 (record the real answer next to each)

| ID | Question | Answer |
| --- | --- | --- |
| VER-01 | Name of the `profiles.role` check constraint | `profiles_role_check` (auto-named inline CHECK; SQL has no explicit name). Constraint: `check (role in ('admin', 'editor', 'viewer'))`. From `server/db/schema.sql`. |
| VER-02 | Name of the `updated_at` trigger function | Function `public.set_updated_at()`; triggers are named `<table>_set_updated_at` (e.g. `profiles_set_updated_at`, `modules_set_updated_at`). |
| VER-03 | Is `schema.sql` idempotent (`if not exists`, `create or replace`)? Name of the signup trigger and function | Yes, idempotent: `create ... if not exists`, `create or replace function`, `drop ... if exists` + `create`, `do $$ ... exception`. Signup trigger `on_auth_user_created` on `auth.users` (after insert) → function `public.handle_new_user()` (security definer). Copies only `full_name` from `raw_user_meta_data->>'full_name'`; role defaults to `viewer` via column default; no `approval_status` column yet; on conflict updates email + updated_at only. |
| VER-04 | How `db/pool.js` exposes transactions (helper name and usage); does the connection bypass RLS? | Exports `getPool()`, `dbQuery(text, params)`, `withTransaction(work)` (work receives a pg client; BEGIN/COMMIT/ROLLBACK handled), `checkDatabase()`, `closePool()`. Config via `getPgConfig()` (`server/db/config.js`, `DATABASE_URL`). Connects directly to Postgres as the DB user, so it **bypasses RLS** (RLS applies only to Supabase anon/authenticated clients). Matches the PLAN risk note. |
| VER-05 | Shape of `req.user` / `req.profile` set by `middleware/auth.js` | Middleware sets `req.auth = { token, user, profile }`: `req.auth.user` = Supabase user (id, email, email_confirmed_at, exp, …); `req.auth.profile` = mapped profile (id, email, fullName, role, createdAt, updatedAt). There is no bare `req.user`/`req.profile`. `currentUserPayload(req)` returns `{ user: { id, email, emailConfirmedAt }, profile, tokenExpiresAt }`. Spec `06-security-storage.md` corrected to `req.auth.*` (see notes). |
| VER-06 | Error helpers exported by `lib/errors.js` | `AppError` class plus `badRequest`, `unauthorized`, `forbidden`, `notFound`, `conflict`, `unprocessable`, `asyncHandler`. (DB-error mapping lives in `middleware/error.js`, not lib.) |
| VER-07 | How `utils/mappers.js` converts snake_case to camelCase | Manual per-entity mappers (not automatic). `mapProfile(row)` → `{ id, email, fullName (full_name), role, createdAt (created_at), updatedAt (updated_at) }`. Also `mapPresenter`, `mapTheme`, `mapModule`. |
| VER-08 | Is the server ESM (`"type": "module"`)? Node version in use | ESM yes (`"type": "module"` in package.json). CI (deploy.yml) uses Node 18; local dev runs Node v22.12.0. No `engines` field in package.json. |
| VER-09 | How `routes/index.js` mounts routers and applies auth | Mounts `/auth` → authRoutes (public), `/` → publicRoutes, `/admin` → `requireAuth` + `requireRole('admin','editor')` + adminRoutes. No global auth. New LMS routers must mount under role prefixes (e.g. `/faculty`, `/student`) with their own middleware. |
| VER-10 | How `ContentProvider.jsx` wraps the app in `main.jsx`, and how the fallback works | `src/main.jsx` does NOT wrap in ContentProvider; it renders `<App />` inside `<BrowserRouter basename={BASE_URL}>` inside `<StrictMode>`. ContentProvider wraps the site shell in `src/App.jsx`. Fallback: initial state `fallbackContent` (bundled modules/themes/stats); calls `fetchSiteContent` on mount; empty result or error → `syncStatus='fallback'` keeping bundled data; success → `syncStatus='ready'`. LMS pages must not use this fallback. |
| VER-11 | Which Supabase clients `lib/supabase.js` creates (anon and service) | `getAuthClient()` (anon key, no session persistence) and `getServiceClient()` (service role key, cached singleton). `verifyAccessToken(token)` uses the service client when configured else the anon client, calling `client.auth.getUser(token)`. |
| VER-12 | What `.github/workflows/deploy.yml` deploys and where | Runs on push to `main` (and manual dispatch): Node 18, `npm ci`, `npm run build`, copies `dist/index.html` → `dist/404.html`, deploys the static `dist/` build to GitHub Pages. No API is deployed (static SPA only). |

### Notes from HK-01

- **Spec correction (`specs/06-security-storage.md`):** the authorization matrix/middleware section said `requireAuth` populates `req.user` / `req.profile`. The code actually populates `req.auth.user` / `req.auth.profile` (see VER-05). The spec text was corrected to `req.auth.user` / `req.auth.profile`.
- **Spec/plan wording (VER-10):** plan/AGENT phrasing "ContentProvider wraps the app in main.jsx" is imprecise — it wraps the site shell in `src/App.jsx`, not `main.jsx`. Behaviour is unchanged; no code change needed, but future tasks should import from `src/App.jsx`'s provider scope.
- **Role constants (VER-01/09):** legacy roles `viewer`/`editor` are still in use across `schema.sql`, `routes/index.js` (`requireRole('admin','editor')`), `validators/*` (`roleSchema`), and `make-admin.js` (promotes to `admin`). AUTH-01..AUTH-04 will rename these to `student`/`faculty`. Confirmed there is no `approval_status` column or `first_name`/`last_name`/`student_number` yet — AUTH-01 must add them.

## Facts already known (from README.md and docs/API.md)

- Auth cookies: `si_access_token`, `si_refresh_token` (HttpOnly). Bearer tokens also accepted.
- `/auth/login` returns `{ user, profile, expiresAt }`; `/auth/refresh`, `/auth/logout`, `/auth/me`, `/auth/forgot-password` exist.
- Signup trigger creates a `profiles` row with role `viewer`. `make:admin` promotes by email.
- Rate limiting, Helmet and a CORS allow-list (`CORS_ORIGIN`) exist. `TRUST_PROXY`, `COOKIE_SECURE`, `COOKIE_SAME_SITE` are env-driven.
- Vite dev server proxies `/api` to `http://localhost:4000`. The frontend base is `VITE_API_BASE_URL` (default `/api/v1`).
- `vercel.json` serves the SPA only; the API needs its own Node host. `npm run deploy` publishes a static build to GitHub Pages with no API.
- Business protections to keep: last admin cannot be demoted; admins cannot remove their own access.
- Legacy module ids are integers; presenters and profiles use UUIDs.
