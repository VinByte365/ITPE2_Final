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

### 2026-10-31 · cline · agent
- **Finished:** AUTH-09
- **In progress:** none
- **Decisions / assumptions:** Extended auth routes: GET /auth/me returns new profile fields (via mapProfile), added PATCH /auth/me with updateMeSchema validation. Service method updateMyProfile allows firstName/lastName/studentNumber updates, blocks student number changes once set (non-admin), checks duplicates, recomputes full_name. Role/approval status not editable. Server boots, lint/build/test pass.
- **Surprises / problems:** none.
- **Next task:** AUTH-10 (Admin approvals)

### 2026-10-31 · cline · agent
- **Finished:** AUTH-10
- **In progress:** none
- **Decisions / assumptions:** Admin approvals: GET /admin/profiles now supports ?approvalStatus and ?role query filters. PATCH /admin/profiles/:id accepts {role?, approvalStatus?} via updateProfileAdminSchema. changeProfileRole updated to handle both role and approvalStatus changes with last-admin and self-demotion protections. listProfiles updated to accept filters. Server boots, lint/build/test pass.
- **Surprises / problems:** none.
- **Next task:** AUTH-11 (originGuard middleware)

### 2026-10-31 · cline · agent
- **Finished:** AUTH-11, AUTH-12
- **In progress:** none
- **Decisions / assumptions:** Created originGuard middleware (foreign origin → ORIGIN_NOT_ALLOWED 403, non-JSON content type → 403, same-origin/no-origin passes). Wired into app.js before compression. Added 8 unit tests. All 31 tests pass.
- **Surprises / problems:** none.
- **Next task:** AUTH-13 (src/api/client.js frontend)

### 2026-10-31 · cline · agent
- **Finished:** AUTH-13, AUTH-14, AUTH-15, AUTH-16, AUTH-17, AUTH-18
- **In progress:** none
- **Decisions / assumptions:** Frontend auth layer: src/api/client.js (fetch wrapper with 401 single-flight refresh, ApiError with code/details/requestId, uploadToSignedUrl), src/api/auth.js, AuthContext/useAuth (loading/anonymous/authenticated states, login/logout/refreshProfile), ProtectedRoute (role check, pending faculty redirect, ?next= same-origin), auth pages (Login, Register with student/faculty toggle, Forgot password, Pending approval), role-aware SiteHeader (Login/Register vs Dashboard+name+Logout), Admin users page (/admin/users with approve/reject/role change). Route tree updated in App.jsx with all auth + protected LMS routes. Lint and build pass.
- **Surprises / problems:** none.
- **Next task:** AUTH-19 (Update docs)

### 2026-10-31 · cline · agent
- **Finished:** AUTH-19 (Phase 01 complete)
- **In progress:** none
- **Decisions / assumptions:** Updated docs: README.md roles table (student/faculty/admin), docs/API.md (roles, admin profile PATCH with approvalStatus). All 23 AUTH tasks complete. Phase 01 done: backend auth (migration, trigger, RLS, role constants, middleware, register/login/me/PATCH, admin approvals, originGuard) + frontend (API client, AuthContext, ProtectedRoute, auth pages, role-aware header, admin users page) + tests (31 passing) + docs updated.
- **Surprises / problems:** none.
- **Next task:** SUBJ-01 (Phase 02: Subjects and enrollment)

### 2026-10-31 · cline · agent
- **Finished:** SUBJ-01, SUBJ-02, SUBJ-03, SUBJ-04, SUBJ-05
- **In progress:** none
- **Decisions / assumptions:** Created migration 002_subjects_enrollments.sql (subjects + enrollments tables, RLS no policies, idempotent, verified). Join-code generator (8 chars, crypto.randomInt, 5 tests). Subject validators (code, term, school year, passing percent). Repository + service + faculty routes (CRUD, join-code regen, enrollment toggle, archive, roster, remove student) + requireSubjectOwner/requireEnrolled middleware. Server boots, lint/build/test pass (36 tests).
- **Surprises / problems:** none.
- **Next task:** SUBJ-06 (student enrollment endpoint)

### 2026-10-31 · cline · agent
- **Finished:** SUBJ-06, SUBJ-07, SUBJ-08, SUBJ-09
- **In progress:** none
- **Decisions / assumptions:** Student enrollment endpoint with rate limiting (enrollLimiter 10/10min), invalid/closed/duplicate handling, rejoin support. Roster sorted by surname, remove student sets status=removed (access revoked, attempts preserved). Passing percent update validated (1-100). Added 10 subject validator tests. requireEnrolled middleware now checks active enrollment. Server boots, lint/build/test pass (46 tests).
- **Surprises / problems:** none.
- **Next task:** SUBJ-10 (Faculty dashboard frontend)

### 2026-10-31 · cline · agent
- **Finished:** SUBJ-10, SUBJ-11, SUBJ-12, SUBJ-13, SUBJ-14
- **In progress:** none
- **Decisions / assumptions:** Frontend subjects: Faculty dashboard (subject cards with student count), Create subject page, Roster page (sorted by surname, remove student), Student dashboard (enrolled subjects), Join subject page (auto-uppercase code input). Updated API docs. Added src/api/subjects.js with all subject/enrollment API calls. App.jsx routes updated. Lint and build pass.
- **Surprises / problems:** none.
- **Next task:** SUBJ-V1 (Phase 02 verification) or TOPIC-01 (Phase 03)

### 2026-11-01 � cline � agent
- **Finished:** TOPIC-08 to TOPIC-12 gap closure before commit � content object-existence verification on create (TOPIC-09), draft gating in student topic detail, POST /student/topics/:id/complete with idempotent topic_progress (TOPIC-11), 27 new service tests using a `setDeps` fake-repository seam (TOPIC-12). 100 tests pass; lint & build pass.
- **In progress:** none
- **Decisions / assumptions:** Refactored topics/content/student-topics services to use a mutable `deps` container + `setDeps` so service-level tests can inject fake repositories (matches the TOPIC-07 "fake repository" convention); added `recordTopicProgress` to topics.repository.js. PROGRESS.md regenerated (56/155, 36%).
- **Surprises / problems:** ESM module namespace objects are read-only in Node 22, so reassigning repository exports (as originally planned) failed; introduced the `setDeps` seam instead. Two PROGRESS.md copies (PLANS/ and docs/lms/checklists/) kept in sync by copying.
- **Next task:** TOPIC-13 (MarkdownView + SlidesEmbed shared components)

### 2026-11-01 � cline � agent
- **Finished:** TOPIC-13 to TOPIC-17 (frontend): MarkdownView (react-markdown, no raw HTML) + SlidesEmbed (Google Slides embed, PDF embed, pptx download); src/api/topics.js; FacultyTopics (list, add one, bulk dialog with date preview, reorder, publish toggle); TopicEditor (details + content blocks, markdown preview, upload with progress, faculty-only toggle); SubjectTopics (grayed scheduled, TopicCard, StatusBadge); TopicView (blocks rendered, Mark as done, friendly TOPIC_NOT_AVAILABLE). Plus student content endpoint. 100 tests pass; lint (0 errors) & build pass.
- **In progress:** none
- **Decisions / assumptions:** Added react-markdown (listed in specs/04-frontend.md). Added GET /student/topics/:id/content route (listStudentContent) to support TopicView blocks. TOPIC-V1..V4 left unticked (manual QA).
- **Surprises / problems:** None blocking.
- **Next task:** TOPIC-V1 (manual verification) or Phase 04 QUIZ-01.

### 2026-11-01 � cline � agent
- **Finished:** QUIZ-01 (migration 004_quizzes_attempts.sql: quizzes, questions, attempts; partial unique index for one open attempt per student per quiz; RLS no policies; idempotent).
- **In progress:** none
- **Decisions / assumptions:** Followed data-model spec sketch; partial unique index ttempts_open_unique_idx on (quiz_id, student_id) where status in (in_progress, pending_review).
- **Surprises / problems:** none.
- **Next task:** QUIZ-02 (pure grading module).

### 2026-11-01 � cline � agent
- **Finished:** QUIZ-02 (pure grading module: normalizeText, gradeQuestion, gradeAttempt, isPassed, computePercent; 20 tests).
- **In progress:** none
- **Decisions / assumptions:** BR-01 formula used exactly (hundredths comparison); BR-09 NFKC normalization.
- **Surprises / problems:** none.
- **Next task:** QUIZ-03 (quiz and question validators).

### 2026-11-01 � cline � agent
- **Finished:** QUIZ-03 (quiz and question validators: choice 2-6 options + one correct, text >=1 accepted answer, prompt limits, points > 0, import payload; 13 tests).
- **In progress:** none
- **Decisions / assumptions:** Used Zod discriminated union by type; importPayloadSchema caps at 20 questions.
- **Surprises / problems:** none.
- **Next task:** QUIZ-04 (quiz meta service and routes).

### 2026-11-01 � cline � agent
- **Finished:** QUIZ-04 (quiz meta service + routes GET/PUT /faculty/topics/:id/quiz; quizzes.repository; mappers mapQuiz; mode locked once attempts exist).
- **In progress:** none
- **Decisions / assumptions:** Mode lock returns 409 QUIZ_HAS_ATTEMPTS when attempts exist.
- **Surprises / problems:** none.
- **Next task:** QUIZ-05 (question CRUD and reorder).

### 2026-11-01 � cline � agent
- **Finished:** QUIZ-05 (question CRUD and reorder: repository functions, service with server-generated option ids, 20-question cap, published-quiz deletion guard; routes).
- **In progress:** none
- **Decisions / assumptions:** Option ids generated server-side as random 8-char strings; reorder transactional.
- **Surprises / problems:** none.
- **Next task:** QUIZ-06 (publish rules).

### 2026-11-01 � cline � agent
- **Finished:** QUIZ-06 (publish rules: built quiz needs 10-20 questions, uploaded needs totalItems; PATCH /faculty/quizzes/:id; deletion guard already in QUIZ-05).
- **In progress:** none
- **Decisions / assumptions:** Publish via PATCH status; invalid count ? 422 QUIZ_QUESTION_COUNT.
- **Surprises / problems:** none.
- **Next task:** QUIZ-07 (bulk question import endpoint).

### 2026-11-01 � cline � agent
- **Finished:** QUIZ-07 (bulk question import endpoint: atomic, row-level error details, total-over-20 rejected; createQuestionsBulk transactional).
- **In progress:** none
- **Decisions / assumptions:** Validation uses questionSchema per row; errors array returned in AppError.details.
- **Surprises / problems:** none.
- **Next task:** QUIZ-08 (student start/resume attempt).
