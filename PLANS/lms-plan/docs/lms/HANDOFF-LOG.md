# Handoff Log

Append-only. Newest entry **at the bottom**. Never edit old entries; add a correction in a new one.

## Entry template

```markdown
### YYYY-MM-DD · @name · (human | agent)
- **Finished:** TASK-IDs
- **In progress:** TASK-ID and the exact state (files touched, what remains)
- **Decisions / assumptions:** DEC-IDs added or changed
- **Surprises / problems:**
- **Next task:** TASK-ID
```

---

### 2026-10-31 · planning · agent
- **Finished:** Created `docs/lms/` (plan, agent rules, decisions, specs, checklists). No application code has been written or changed.
- **In progress:** none
- **Decisions / assumptions:** DEC-01 to DEC-30 recorded as assumed or confirmed; see `DECISIONS.md`.
- **Surprises / problems:** The original `structure.txt` showed folders only, and the plan was written from the README, `docs/API.md` and the "UI Done" commit stat. Nobody has read the source files yet, so verify everything in HK-01 before building.
- **Next task:** HK-01

### 2026-10-31 · cline · agent
- **Finished:** HK-01
- **In progress:** none
- **Decisions / assumptions:** Recorded VER-01 to VER-12 answers in `DECISIONS.md` (both copies). Corrected `specs/06-security-storage.md` `requireAuth` row to use `req.auth.*` (VER-05). Noted VER-10 wording imprecision (ContentProvider wraps the site shell in `src/App.jsx`, not `main.jsx`).
- **Surprises / problems:** Legacy roles `viewer`/`editor` still present in schema, routes, validators and make-admin; no `approval_status`/`first_name`/`last_name`/`student_number` columns yet (expected; AUTH-01 adds them). Confirmed the pg pool bypasses RLS as suspected (PLAN risk). Local Node v22.12.0 vs CI Node 18.
- **Next task:** HK-02

### 2026-10-31 · cline · agent
- **Finished:** HK-02
- **In progress:** none
- **Decisions / assumptions:** Added `structure.txt` to `.gitignore`. Removed two unused tracked stray screenshots (`src/assets/css/IMG_8692.JPG`, `IMG_8693.JPG`) via `git rm` (recoverable from history). Verified `git ls-files .env node_modules` is empty. Checked the `class-01.jpg`/`og-cover.jpg` duplicate by MD5 (identical: BF08BAA471899FDEBEB78A36D992F745); both are referenced (`src/pages/{Home,About}Page.jsx` imports class-01; `index.html` OG meta uses /og-cover.jpg), so both kept per the "only if nothing imports the removed copy" rule.
- **Surprises / problems:** none.
- **Next task:** HK-03

### 2026-10-31 · cline · agent
- **Finished:** HK-03 (partially — local branch + commit only)
- **In progress:** HK-03 push (blocked)
- **Decisions / assumptions:** Created local branch `lms` from `master` and committed HK-01+HK-02 work as `55bb686` ("HK-01, HK-02: verify codebase facts and git hygiene", 31 files). `git push -u origin lms` failed with 403 (Takodachi48 lacks push access to VinByte365/ITPE2_Final). Commit format `TASK-ID: summary` is already documented in `README.md` and the checklists. HK-03 left unticked with ⛔ marker.
- **Surprises / problems:** Push permission denied. User (or an authorized account) must push the `lms` branch; alternatively grant `Takodachi48` write access to the repo.
- **Next task:** HK-04 (after HK-03 is unblocked) — or skip to HK-04 which has no git dependency.

### 2026-10-31 · cline · agent
- **Finished:** HK-04
- **In progress:** none
- **Decisions / assumptions:** Added `server/scripts/migrate.js` (bootstraps `public.schema_migrations`, applies `NNN_*.sql` in order, each in its own transaction, skips applied, idempotent re-runs). Added `server/db/migrations/README.md`. Wired `db:migrate` in `package.json`. Documented `db:schema` then `db:migrate` in `README.md`. Script runs cleanly (exits 1 only because `DATABASE_URL` is unset in this env).
- **Surprises / problems:** none.
- **Next task:** HK-05

### 2026-10-31 · cline · agent
- **Finished:** HK-05
- **In progress:** none
- **Decisions / assumptions:** Wired `test`: `node --test` in `package.json`. Added `server/utils/slug.test.js` with 7 real tests for `slugify` (casing, accents, ampersands, collapsing, trimming, fallback, truncation). `npm test` passes (7/7).
- **Surprises / problems:** none.
- **Next task:** HK-06

### 2026-10-31 · cline · agent
- **Finished:** HK-04, HK-05, HK-06, HK-10
- **In progress:** none
- **Decisions / assumptions:** Migration runner (`server/scripts/migrate.js` + `db:migrate`), test runner (`npm test`, 7 slug tests), progress script wired (`npm run docs:progress` → `docs/lms/checklists/PROGRESS.md`, 6/155 done), and `docs/lms/` added to the repo with a README link. `lint`, `build` and `test` all pass.
- **Surprises / problems:** `docs/lms/` is now a third copy alongside the two `PLANS/` copies; keep them in sync until the PLANS layer is retired.
- **Next task:** HK-07 (environment additions) — or HK-03 push (still blocked on permissions).

### 2026-10-31 · cline · agent
- **Finished:** HK-07
- **In progress:** none
- **Decisions / assumptions:** Added `STORAGE_TOPIC_BUCKET` (default `topic-files`), `STORAGE_UPLOAD_BUCKET` (default `quiz-uploads`), `SIGNED_URL_TTL_SECONDS` (120), `MAX_FILE_MB` (25), `MAX_IMAGE_MB` (5), `DEFAULT_TIMEZONE` (`Asia/Manila`) to `.env.example` and `server/config/env.js` (`env.storage.*`, `env.defaultTimezone`), validated with defaults via `parsePositiveNumber`/`read`. Verified `env.js` loads with the existing `.env` (storage + tz resolved). Server still boots with old `.env` (all new vars default).
- **Surprises / problems:** none.
- **Next task:** HK-08

### 2026-10-31 · cline · agent
- **Finished:** HK-09 (HK-08 and HK-V1 blocked)
- **In progress:** HK-08 (blocked on Supabase credentials)
- **Decisions / assumptions:** Added `server/scripts/setup-storage.js` (creates private buckets `topic-files` and `quiz-uploads` idempotently via service role; re-running harmless) and wired `storage:setup` in `package.json`. Script runs cleanly (exits 1 only because service creds are unset). HK-08 and HK-V1 left ⛔ — they require a configured Supabase project; scripts are unchanged, verify on a real project.
- **Surprises / problems:** No Supabase project configured in this environment, so db:schema/db:seed/make:admin/dev:all and storage bucket creation could not be exercised.
- **Next task:** HK-V1 (after HK-08 is unblocked) — or phase 01 (AUTH-01) which is code work independent of the live Supabase verification.

### 2026-10-31 · cline · agent
- **Finished:** HK-08, HK-V1 (Housekeeping phase 00 complete except HK-03 push)
- **In progress:** HK-03 push (still blocked on permissions)
- **Decisions / assumptions:** HK-08 verified end-to-end on a real Supabase project: db:schema ✅, db:migrate ✅ (0 migrations), db:seed ✅ (16 modules, 32 presenters, 26 videos), storage:setup ✅ (topic-files and quiz-uploads buckets created), make:admin ✅ (user promoted), dev:all ✅ (site loads at localhost:5173). HK-V1 verified: npm install → db:schema → db:migrate → npm test → npm run lint → npm run build all pass. HK-03 remains ⛔ (push 403).
- **Surprises / problems:** Initial SUPABASE_URL had /rest/v1/ suffix causing malformed storage paths; corrected. Service role key was initially invalid; re-copied from dashboard.
- **Next task:** AUTH-01 (001_lms_profiles.sql migration) — Phase 01 begins.

### 2026-10-31 · cline · agent
- **Finished:** AUTH-01, AUTH-02, AUTH-03
- **In progress:** none
- **Decisions / assumptions:** Created `server/db/migrations/001_lms_profiles.sql` (profile columns, role rename viewer→student/editor→faculty, default student, student_number unique index, updated signup trigger `handle_new_user` copying names/student_number with role=student/approved, RLS policies editor→faculty). Verified: migration runs twice (idempotent), new columns present, no viewer/editor rows, admin account intact, student_number index exists, trigger fires correctly (tested with role:admin metadata → profile is student), all 5 RLS manage policies now reference faculty. AUTH-03 done condition met: public site still loads published modules (anon RLS unchanged), /admin/modules works for admin, faculty/student blocked at Express level.
- **Surprises / problems:** none.
- **Next task:** AUTH-04 (role constants replacement)

### 2026-10-31 · cline · agent
- **Finished:** AUTH-04
- **In progress:** none
- **Decisions / assumptions:** Replaced role constants across server code: schema.sql (default student, check admin|faculty|student, RLS has_role array['admin','faculty']), routes/index.js (requireRole admin/faculty), auth.validator.js and common.js (z.enum admin/faculty/student), mappers.js (mapProfile now returns firstName, lastName, studentNumber, approvalStatus), profiles.repository.js (select/insert/return new columns). No viewer/editor string literals remain in server code. Server boots and lint/build/test pass.
- **Surprises / problems:** none.
- **Next task:** AUTH-05 (requireRole, requireApproved middleware)

### 2026-10-31 · cline · agent
- **Finished:** AUTH-05
- **In progress:** none
- **Decisions / assumptions:** Updated `requireRole` to return `ROLE_FORBIDDEN` (403) instead of generic `FORBIDDEN`. Added `requireApproved` middleware: admin bypasses approval, non-admin with `approvalStatus !== 'approved'` gets `APPROVAL_PENDING` (403). Added 7 unit tests in `server/middleware/auth.test.js` (all pass). `forbidden` import removed (unused).
- **Surprises / problems:** none.
- **Next task:** AUTH-06 (Register validator)

### 2026-10-31 · cline · agent
- **Finished:** AUTH-06
- **In progress:** none
- **Decisions / assumptions:** Added `registerSchema` (Zod): role enum student|faculty, email normalized (trim + lowercase), password ≥ 8, names trimmed 1-60, studentNumber required for students with regex ^[A-Za-z0-9-]{4,20}$, .strict() rejects unknown keys. Added 9 unit tests (all pass). Total tests now 23.
- **Surprises / problems:** none.
- **Next task:** AUTH-07 (Auth service register())

### 2026-10-31 · cline · agent
- **Finished:** AUTH-07
- **In progress:** none
- **Decisions / assumptions:** Added `register()` to auth.service.js: pre-checks duplicate student number, calls Supabase signUp with metadata, maps duplicate email/student number to 409, upgrades faculty profiles (role=faculty, approval=pending), returns {profile, requiresEmailConfirmation, pendingApproval}. Added `findProfileByStudentNumber` and `updateProfile` to profiles.repository.js. End-to-end verification blocked by Supabase email rate limit (too many test signups); logic verified by code review and supporting pieces (trigger AUTH-02, validator AUTH-06, repository) all tested.
- **Surprises / problems:** Supabase email rate limit prevented full end-to-end test. Should verify with a real signup once rate limit resets.
- **Next task:** AUTH-08 (POST /auth/register route)

### 2026-10-31 · cline · agent
- **Finished:** AUTH-08
- **In progress:** none
- **Decisions / assumptions:** Added `POST /auth/register` route with `registerLimiter` (5/hour/IP). Returns 201 with `{profile, requiresEmailConfirmation, pendingApproval}`, sets no cookies. Validation (422) and rate limiting verified. End-to-end signup blocked by Supabase email rate limit (too many test signups); validation path confirmed working.
- **Surprises / problems:** Supabase email rate limit still active from earlier test signups. Full E2E signup test deferred.
- **Next task:** AUTH-09 (Extend login, /auth/me, PATCH /auth/me)
