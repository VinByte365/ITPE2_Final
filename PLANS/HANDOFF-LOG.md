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
