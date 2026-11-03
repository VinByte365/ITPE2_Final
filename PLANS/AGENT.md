# Agent Instructions

You are continuing a human-led project. Several people and agents work on it over time, so
**everything you learn or change must be written down in this folder.**

## Session workflow

1. Read, in order: `README.md`, `DECISIONS.md`, the last 5 entries of `HANDOFF-LOG.md`,
   `checklists/PROGRESS.md`.
2. Open the first checklist that is not finished (lowest number) and find the first unticked task
   with no 🚧 or ⛔ marker. If its phase depends on an unfinished earlier phase, stop and tell the user.
3. Claim it: append ` — 🚧 @<agent-or-user-name>` to the task line.
4. Read the specs the task needs (`specs/…`). Read the **existing code you will touch** before
   writing anything, and follow its style.
5. Implement the task. Keep changes small and focused.
6. Verify against the task's *Done when*. Run `npm run lint`, `npm run build` and `npm test`
   (when they exist). For UI work, also run the app and use it.
7. Tick the box, replace 🚧 with ` (@name, YYYY-MM-DD)`, then commit as `TASK-ID: summary`.
8. Repeat from step 2. Stop after about 5 tasks or when blocked.
9. Before ending, append an entry to `HANDOFF-LOG.md` and run `node PLANS/progress.mjs`.

## Project conventions (verify in HK-01; the repo wins over this file if they disagree, then update this file)

- Backend layering: `routes/*.routes.js` (HTTP only) → `services/*.service.js` (rules, transactions)
  → `repositories/*.repository.js` (SQL only) with Zod schemas in `validators/`.
- Responses use `{ data }`, `{ data, meta }` and `{ error: { code, message, details }, requestId }`
  exactly as `docs/API.md` describes. Validation errors are `422`, malformed JSON `400`.
- Throw errors through `server/lib/errors.js`; never build error JSON by hand.
- Express 5 forwards rejected promises from async handlers to the error middleware; do not add
  try/catch wrappers just for that.
- Database columns are `snake_case`; API fields are `camelCase`; convert in `utils/mappers.js`.
- Always use parameterized SQL (`$1, $2`). Never concatenate user input into SQL.
- Multi-step writes (reorder, bulk create, grading) run in one transaction.
- Dates are stored as `timestamptz`. Scheduling logic is timezone-aware (`Asia/Manila` by default).
- Frontend: function components, React Router 7, shared styles in `src/index.css` using the
  existing variables and class patterns. LMS pages never use the bundled-data fallback.
- New npm dependencies are allowed only if listed in `specs/04-frontend.md` or recorded in
  `DECISIONS.md` first.

## Hard rules

- **Authorization is enforced on the server for every endpoint**, never only in the UI.
  Faculty touch only their own subjects. Students touch only their own data in subjects they are enrolled in.
- **Never send quiz answer keys to students.** Strip `correctOptionId` and `acceptedAnswers` in the service layer.
- Do not edit `.env`, commit secrets, or print keys in logs. `SUPABASE_SERVICE_ROLE_KEY` and `DATABASE_URL` stay server-side.
- Migrations are additive and idempotent. Never edit a migration that has been merged; add a new one.
  Never run destructive SQL (`drop table`, `truncate`, unqualified `delete`) without a task that says so.
- Do not modify legacy content code (`modules`, `themes`, `presenters`) unless a task says so.
- Do not change the meaning of a rule in `specs/03-business-rules.md` silently. Add or update a `DEC-` entry.
- Do not tick a task you did not verify. If you could not run something, say so in the log.

## When to stop and ask the user

- A task needs a destructive or irreversible change (data loss, role semantics, auth flow).
- The repo contradicts a spec in a way that changes behaviour.
- You need a new service, paid feature, or dependency not listed anywhere.
- You are about to make an assumption that affects grading, gating, or privacy.

For smaller gaps: pick the simplest reasonable option, record it in `DECISIONS.md` with status
`assumed`, continue, and mention it in the log.

## Quality bar for each task

- Input validated with Zod; errors use the standard codes in `specs/02-api.md`.
- Pure logic (grading, gating, scheduling, sorting, report building) lives in pure functions with
  `node --test` tests. Put tests next to the code as `*.test.js`.
- UI shows loading, empty, error and success states; works at 360 px wide; is keyboard-usable.
- No dead code, no commented-out blocks, no stray `console.log`.

## HANDOFF-LOG entry (copy the template at the top of that file)

Include: date, author, tasks finished, tasks started but not finished (with exact state), anything
surprising, decisions made, and the exact next task ID.
