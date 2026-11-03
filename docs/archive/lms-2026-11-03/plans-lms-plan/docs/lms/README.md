# LMS Project Hub

Repurposing **Systems Index** into a simple LMS: faculty create subjects, topics and quizzes;
students join with a code, learn on a schedule, take quizzes, and progress only by passing.

## Start here

- **Humans:** read [`PLAN.md`](PLAN.md) (10 min), open [`checklists/PROGRESS.md`](checklists/PROGRESS.md),
  pick the first phase that is not finished, read the last entries of [`HANDOFF-LOG.md`](HANDOFF-LOG.md).
- **AI agents:** read [`AGENT.md`](AGENT.md) first and follow its workflow exactly.

## Folder map

| Path | Purpose | How often it changes |
| --- | --- | --- |
| `PLAN.md` | Goals, architecture, phases, requirement traceability | Rarely |
| `AGENT.md` | Rules and workflow for an AI agent | Rarely |
| `DECISIONS.md` | Assumptions, verified facts, open questions | When something is decided or learned |
| `HANDOFF-LOG.md` | Append-only "where I left off" log | Every work session |
| `specs/` | Exact behaviour: data model, API, rules, UI, reports, security | When a spec is wrong or a decision changes |
| `checklists/` | One checklist per phase; this is what you tick | Daily |
| `progress.mjs` | Counts ticked boxes and rewrites `checklists/PROGRESS.md` | Never |

Plan and checklists are separate on purpose: ticking boxes never touches the plan, so there are
fewer merge conflicts and a cleaner git history.

## How the checklists work

```markdown
- [ ] AUTH-07 Auth service `register()`
  - Files: `server/services/auth.service.js` · Done when: duplicate email returns 409; faculty is created as `pending`
```

1. A task is **done** only when its *Done when* condition is true and you have checked it yourself.
2. Claim a task by appending ` — 🚧 @yourname` to its line and committing. Remove the marker when you tick it.
3. Tick it as `[x]` and append ` (@yourname, YYYY-MM-DD)`.
4. Blocked? Leave it unticked, append ` — ⛔ reason`, and write the details in `HANDOFF-LOG.md`.
5. Tasks marked `(stretch)` are optional and not counted in the totals.
6. Run `npm run docs:progress` (task HK-06 adds the script) to refresh `checklists/PROGRESS.md`.
   Until then run `node docs/lms/progress.mjs`.
7. Never delete or renumber a task. If a task is wrong, strike it through (`~~text~~`), explain in
   `DECISIONS.md`, and add a new task with the next free number.

## Task ID prefixes

`HK` housekeeping · `AUTH` auth and roles · `SUBJ` subjects and enrollment · `TOPIC` topics and content ·
`QUIZ` built-in quizzes · `UPL` uploaded quizzes · `GATE` gating and progress · `RPT` reports and exports · `QA` testing and deploy.

## Commit message format

`AUTH-07: add register service` (one task per commit where possible; the task ID first).
