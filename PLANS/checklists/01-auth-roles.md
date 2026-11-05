# Phase 01 · Auth and Roles (R1)

Depends on: 00. Specs: `../specs/01-data-model.md` (001), `../specs/02-api.md` (Auth), `../specs/06-security-storage.md`, DEC-01 to DEC-03, DEC-24.

## Backend

- [x] AUTH-01 Migration `001_lms_profiles.sql`: profile columns, role rename, default, student-number index (@cline, 2026-10-31)
  - Files: `server/db/migrations/001_lms_profiles.sql` · Done when: runs twice without error; no `viewer`/`editor` rows remain; role check allows only `admin|faculty|student`; the existing admin account still logs in
- [x] AUTH-02 Update the signup trigger to copy names and student number from metadata, always role `student` (@cline, 2026-10-31)
  - Files: same migration (or `001b`) · Done when: creating a Supabase user with `{role:'admin'}` in metadata yields a `student`; names land in `profiles`
- [x] AUTH-03 Rewrite legacy RLS helpers and policies that reference `editor` (@cline, 2026-10-31)
  - Files: migration · Done when: public site still loads published modules; `/admin/modules` works for admin; faculty/student get `403`
- [x] AUTH-04 Replace role constants everywhere on the server (@cline, 2026-10-31)
  - Files: `server/middleware/auth.js`, `server/routes/admin.routes.js`, `server/validators/*`, `server/scripts/make-admin.js`, `server/utils/mappers.js`, `docs/API.md` · Done when: grep finds no `viewer`/`editor` in server code; profile mapper returns `firstName`, `lastName`, `studentNumber`, `approvalStatus`
- [x] AUTH-05 Middleware `requireRole`, `requireApproved` (@cline, 2026-10-31)
  - Files: `server/middleware/auth.js` · Done when: unit tests show correct `403` codes `ROLE_FORBIDDEN` and `APPROVAL_PENDING`; admin bypasses approval
- [x] AUTH-06 Register validator (Zod) (@cline, 2026-10-31)
  - Files: `server/validators/auth.validator.js` · Done when: email normalized, password ≥ 8 chars, names trimmed 1 to 60, student requires `studentNumber` matching `^[A-Za-z0-9-]{4,20}$`, `role` limited to `student|faculty`, unknown keys rejected
- [x] AUTH-07 Auth service `register()` (@cline, 2026-10-31)
  - Files: `server/services/auth.service.js`, `server/repositories/profiles.repository.js` · Done when: student → approved; faculty → role `faculty` + `pending`; `full_name` filled; duplicate email → `409`; duplicate student number → `409`; failure after sign-up is logged with the user id
- [x] AUTH-08 Route `POST /auth/register` with rate limit and the response shape in the API spec (@cline, 2026-10-31)
  - Files: `server/routes/auth.routes.js` · Done when: returns `201`, sets no cookies, 6th request/hour/IP returns `429`
- [x] AUTH-09 Extend login, `/auth/me` and add `PATCH /auth/me` (@cline, 2026-10-31)
  - Files: `server/routes/auth.routes.js`, `server/services/auth.service.js` · Done when: new profile fields returned; users cannot change role, approval status or (once set) student number
- [x] AUTH-10 Admin approvals: filters on `GET /admin/profiles`, `approvalStatus` on `PATCH` (@cline, 2026-10-31)
  - Files: `server/repositories/profiles.repository.js`, `server/routes/admin.routes.js`, validators · Done when: admin can approve/reject faculty; last-admin and self-demotion protections still pass
- [x] AUTH-11 `originGuard` middleware (@cline, 2026-10-31)
  - Files: `server/middleware/originGuard.js`, `server/app.js` · Done when: a POST with a foreign `Origin` returns `403 ORIGIN_NOT_ALLOWED`; same-origin and no-Origin (curl) requests work; tests cover it
- [x] AUTH-12 Tests (@cline, 2026-10-31)
  - Files: `server/**/*.test.js` · Done when: register validation, role middleware and origin guard are covered and pass

## Frontend

- [x] AUTH-13 `src/api/client.js` (contract in `04-frontend.md`) (@cline, 2026-10-31)
  - Files: `src/api/client.js`, `src/api/auth.js` · Done when: parallel 401s trigger exactly one refresh; `ApiError` exposes code and details
- [x] AUTH-14 `AuthContext` and `useAuth` (@cline, 2026-10-31)
  - Files: `src/auth/AuthContext.jsx`, `src/main.jsx` · Done when: page reload keeps the session; logout clears state
- [x] AUTH-15 `ProtectedRoute` and the new route tree (@cline, 2026-10-31)
  - Files: `src/auth/ProtectedRoute.jsx`, `src/main.jsx` · Done when: wrong-role access redirects; `?next=` only accepts same-origin paths; pending faculty land on `/pending-approval`
- [x] AUTH-16 Pages: Login, Register (student/faculty toggle), Forgot password, Pending approval (@cline, 2026-10-31)
  - Files: `src/auth/pages/*`, `src/layouts/AuthLayout.jsx`, `src/index.css` · Done when: field-level errors shown; works at 360 px; password show/hide; faculty sees "your account needs approval"
- [x] AUTH-17 Role-aware `SiteHeader` (@cline, 2026-10-31)
  - Files: `src/components/SiteHeader.jsx` · Done when: anonymous sees Login/Register; users see dashboard link, name and Logout; mobile menu works
- [x] AUTH-18 Admin users page `/admin/users` (pending faculty, change role) (@cline, 2026-10-31)
  - Files: `src/pages/admin/Users.jsx` · Done when: approve/reject works and the list updates; non-admins cannot open it
- [x] AUTH-19 Update docs (@cline, 2026-10-31)
  - Files: `README.md` (roles table), `docs/API.md`, `../specs/02-api.md` · Done when: docs match the real behaviour

## Phase verification

- [ ] AUTH-V1 Register a student, confirm email if required, log in, land on `/student`
- [ ] AUTH-V2 Register faculty → see "pending"; admin approves; faculty logs in and lands on `/faculty`
- [x] AUTH-V3 Student URL `/faculty` redirects; `curl` to a faculty API as a student returns `403 ROLE_FORBIDDEN` (@kilo, 2026-11-05)
- [ ] AUTH-V4 Sign up directly through Supabase with `role: admin` metadata → account is a student
