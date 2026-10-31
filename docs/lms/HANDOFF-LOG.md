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
