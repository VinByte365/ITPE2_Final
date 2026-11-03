# Master Plan

## 1. Goal

Turn the existing public "Systems Index" site (React 19 + Vite frontend, Express 5 + Supabase API)
into a small LMS for faculty and students. Reuse the existing backend layering and auth; do not
rewrite it.

## 2. Requirements and where they are delivered

| ID | Requirement (from the brief) | Phase / checklist |
| --- | --- | --- |
| R1 | Login and register for faculty and student | 01 AUTH |
| R2 | Faculty add a subject with a code for students to join; subject has term/semester and school year | 02 SUBJ |
| R3 | Topics/lessons per meeting by schedule; current topic opens only on schedule; past topics stay readable; future topics grayed out | 03 TOPIC, 06 GATE |
| R4 | Faculty insert text, upload a presentation, add summaries and notes to a topic | 03 TOPIC |
| R5 | Quiz: 10 to 20 questions typed in-app (multiple choice and text input), or an uploaded quiz graded manually; bulk question import | 04 QUIZ, 05 UPL |
| R6 | Summary preview before print / PDF / spreadsheet; sort by surname and by score | 07 RPT |
| R7 | Summary of all quiz scores per student | 07 RPT |
| X1 | Passing % (50 or 75) changeable at any time and reflected automatically as pass/fail | 02 SUBJ, 06 GATE, 07 RPT |
| X2 | Student cannot proceed to the next topic after failing a quiz; must repeat the topic | 06 GATE |
| X3 | Any number of topics: add many at once (e.g. 10 to 16) or one at a time | 03 TOPIC |

R5 clarification (confirmed by the product owner): for an **uploaded quiz**, the student takes the
quiz elsewhere, uploads an image showing their score, and faculty type the grade in manually.
"Database upload" is interpreted as **CSV/spreadsheet import of questions** (see DEC-17, DEC-20).

## 3. Architecture (reuse first)

| Existing piece | Reuse in the LMS |
| --- | --- |
| Route → service → repository → Zod validator layering | Same layering for every new feature |
| `lib/errors.js`, `middleware/error.js`, `{data, meta}` / `{error}` response envelope | Unchanged; all new endpoints follow `docs/API.md` conventions |
| Supabase Auth + HttpOnly cookies (`si_access_token`, `si_refresh_token`), `/auth/*` | Extended with register, approval, and new roles |
| `profiles` table + signup trigger + `make:admin` script | Extended (names, student number, approval status, renamed roles) |
| `rateLimit.js`, Helmet, CORS allow-list | Applied to register, enroll, upload endpoints |
| `ModuleDetailPage` slide embed and video tabs | Extracted into shared components for topic pages |
| `src/index.css`, `Icons.jsx`, `Reveal.jsx`, `SiteHeader.jsx` | Reused; header becomes role-aware |
| `ContentProvider` fallback-to-bundled-data | **Not used** for LMS pages (auth and grades cannot work offline) |
| Legacy tables `themes`, `modules`, `presenters`, `module_videos`, `module_presenters` | Left untouched; the public site keeps working until QA-08 |

New code goes next to the old: new tables use UUID keys and get numbered migrations in
`server/db/migrations/`. See `specs/` for details.

## 4. Phases and dependencies

```text
00 HK ──► 01 AUTH ──► 02 SUBJ ──► 03 TOPIC ──► 04 QUIZ ──► 05 UPL
                                                   │           │
                                                   └─────┬─────┘
                                                         ▼
                                                    06 GATE ──► 07 RPT ──► 08 QA
```

| Phase | Outcome when finished |
| --- | --- |
| 00 Housekeeping | Repo clean, facts verified, migration runner and test runner work |
| 01 Auth and roles | Students and faculty can register and log in; faculty approved by admin; role-protected routes |
| 02 Subjects | Faculty create subjects and share a join code; students enroll; passing % is configurable |
| 03 Topics and content | Faculty create topics (bulk or single) with schedule and content; students see scheduled/grayed topics and read open ones |
| 04 Built-in quizzes | Faculty build 10 to 20 question quizzes; students take them and get graded results |
| 05 Uploaded quizzes | Students upload a score image; faculty grade it manually |
| 06 Gating | Failed or pending quizzes block the next topic; all states enforced on the server and shown in the UI |
| 07 Reports | Preview, sort, print, PDF, spreadsheet; per-student summary |
| 08 Testing and deploy | Seed data, security and accessibility sweeps, deployment, docs, acceptance |
| 09 UI alignment | LMS pages match the public site's design system; lint clean |

Phase 06 is specified from the start in `specs/03-business-rules.md`. Phases 03 and 04 use simple
stand-ins (schedule-only access) that GATE replaces; each task says where.

Phase 09 is visual alignment and lint health. It depends on 04, 05 and 07 but does not block 08;
it exists because those phases predate the documented design system.

## 5. Key risks

| Risk | Mitigation |
| --- | --- |
| Authorization lives only in Express (the `pg` pool likely bypasses RLS) | Ownership middleware (`specs/06`) plus a QA-03 sweep of every endpoint |
| HttpOnly cookies mean the browser cannot use Supabase Storage directly | API issues signed upload URLs (DEC-18) |
| Cookie auth across sites enables CSRF | Same-site deployment preferred; origin-check middleware (AUTH-11) |
| Supabase exposes `public` tables through its REST API with the anon key | Enable RLS with no policies on all new tables (DEC-25) |
| Changing passing % or publishing a quiz re-locks students | Accepted behaviour (DEC-13); shown clearly to faculty before saving |
| Students photograph quizzes on phones (large or HEIC files) | Restrict `accept` types, downscale in the browser, enforce 5 MB on the server |
| Existing code has not been read in full | HK-01 records facts before anyone builds on assumptions |

## 6. Definition of done (whole project)

- Every task in checklists 00 to 08 is ticked (stretch tasks excluded).
- `npm run lint`, `npm run build` and `npm test` pass.
- The manual QA matrix in `checklists/08-testing-deploy.md` (QA-02) passes for every R and X item.
- A faculty and a student account can complete the whole journey on the deployed system.
- README and `docs/API.md` describe the LMS, not the old content site.
