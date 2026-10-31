# Phase 00 · Housekeeping

Depends on: nothing. Specs: `../specs/01-data-model.md`, `../DECISIONS.md` (VER-xx table).
Goal: a clean repo, verified facts, and the tooling (migrations, tests, progress) every later phase needs.

- [x] HK-01 Read the existing code and record the answers to VER-01 to VER-12 in `DECISIONS.md` (@cline, 2026-10-31)
  - Files: `server/db/schema.sql`, `server/db/pool.js`, `server/middleware/auth.js`, `server/middleware/error.js`, `server/lib/{errors,supabase,cookies}.js`, `server/services/auth.service.js`, `server/repositories/profiles.repository.js`, `server/routes/index.js`, `server/utils/mappers.js`, `package.json`, `src/main.jsx`, `src/data/ContentProvider.jsx`, `.github/workflows/deploy.yml` · Done when: every VER row has an answer; if the repo contradicts a spec, the spec or `AGENT.md` is corrected
- [x] HK-02 Git hygiene (@cline, 2026-10-31)
  - Files: `.gitignore`, `src/assets/` · Done when: `git ls-files .env node_modules` prints nothing; `structure.txt` is ignored; `IMG_8692.JPG` and `IMG_8693.JPG` are moved out of `src/assets/css/` (or removed if unused); duplicate `class-01.jpg`/`og-cover.jpg` (same byte size) checked by hash and de-duplicated only if nothing imports the removed copy
- [ ] HK-03 Create the `lms` integration branch and agree on the commit format `TASK-ID: summary` — ⛔ branch created locally (`lms`, commit 55bb686) but `git push` returned 403 for `Takodachi48` → `VinByte365/ITPE2_Final`; push from an authorized account (or grant push access). Commit format is already documented in `README.md` and the checklists.
  - Files: none · Done when: branch pushed; the format is mentioned in the team chat or the PR template
- [x] HK-04 Migration runner (@cline, 2026-10-31)
  - Files: `server/db/migrations/` (new), `server/scripts/migrate.js`, `package.json` (`db:migrate`) · Done when: applies pending `NNN_*.sql` files in order, each in a transaction, records them in `schema_migrations`, skips applied ones; running it twice changes nothing; README explains "run `db:schema`, then `db:migrate`"
- [x] HK-05 Test runner (@cline, 2026-10-31)
  - Files: `package.json` (`test`: `node --test`), `server/utils/slug.test.js` · Done when: `npm test` runs and passes with at least one real test
- [x] HK-06 Progress script wired in (@cline, 2026-10-31)
  - Files: `package.json` (`docs:progress`: `node docs/lms/progress.mjs`) · Done when: `npm run docs:progress` rewrites `checklists/PROGRESS.md` with correct counts
- [x] HK-07 Environment additions (@cline, 2026-10-31)
  - Files: `.env.example`, `server/config/env.js` · Done when: `STORAGE_TOPIC_BUCKET`, `STORAGE_UPLOAD_BUCKET`, `SIGNED_URL_TTL_SECONDS` (120), `MAX_FILE_MB` (25), `MAX_IMAGE_MB` (5), `DEFAULT_TIMEZONE` (`Asia/Manila`) are documented and validated with defaults; the server still boots with the old `.env`
- [ ] HK-08 Confirm the current app runs locally end to end — ⛔ blocked: requires a configured Supabase project (DATABASE_URL + SUPABASE_SERVICE_ROLE_KEY); none present in this environment. Script logic for db:schema/db:seed/make:admin/dev:all is unchanged; verify on a real project.
  - Files: `README.md` (fix steps if wrong) · Done when: `db:schema`, `db:seed`, `make:admin`, `dev:all` all work on a fresh Supabase project; result written in `HANDOFF-LOG.md`
- [x] HK-09 Storage bucket setup script (@cline, 2026-10-31)
  - Files: `server/scripts/setup-storage.js`, `package.json` (`storage:setup`) · Done when: creates private buckets `topic-files` and `quiz-uploads` idempotently with the service role; re-running is harmless
- [x] HK-10 Add `docs/lms/` to the repo and link it from the root `README.md` (@cline, 2026-10-31)
  - Files: `README.md` · Done when: a short "LMS work in progress" section links to `docs/lms/README.md`

## Phase verification

- [ ] HK-V1 Fresh clone → `npm install` → `npm run db:schema && npm run db:migrate` → `npm test` → `npm run lint` → `npm run build` all succeed
