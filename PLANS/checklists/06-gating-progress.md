# Phase 06 · Gating and Progress (R3, X1, X2)

Depends on: 04 and 05. Specs: `../specs/03-business-rules.md` (BR-02 to BR-07, scenario table), DEC-07, DEC-09, DEC-11 to DEC-13.
Goal: replace the schedule-only stand-ins from phases 03 and 04 with the real rules, enforced on the server and shown in the UI.

## Backend

- [x] GATE-01 Pure `computeTopicStates()`
  - Files: `server/services/progress.service.js`, `progress.service.test.js` · Done when: inputs are plain data (topics, quizzes, attempts, progress rows, passing percent, `now`, timezone-resolved dates); output matches the BR-06 table; all 12 scenarios in the spec are tests and pass
- [x] GATE-02 Efficient data loading for one student and for a whole subject (@kilo, 2026-11-04)
  - Files: `server/repositories/progress.repository.js` · Done when: a fixed number of queries regardless of topic or student count (no N+1); verified with query logging on 16 topics × 40 students
- [x] GATE-03 Real states on the student topic list
  - Files: `server/services/student-topics.service.js` · Done when: returns `scheduled|locked|open|failed|pending_review|completed` with `reason` and `blockedByTopicId`; stand-in code removed
- [x] GATE-04 `assertTopicAccessible()` on every student endpoint that touches a topic
  - Files: `server/services/access.service.js`, services, routes · Done when: topic detail, content download, quiz start, submit, upload-url and submission all return `TOPIC_NOT_AVAILABLE` or `TOPIC_LOCKED` correctly; one test per endpoint
- [x] GATE-05 Dynamic effects of setting changes (@kilo, 2026-11-04)
  - Files: tests · Done when: tests prove that changing passing %, unpublishing/publishing a quiz, regrading and re-grading a manual attempt change states as BR-06 describes, with no stored state to fix
- [x] GATE-06 Faculty progress endpoint (@kilo, 2026-11-04)
  - Files: service, routes · Done when: `GET /faculty/subjects/:id/progress` returns each student's state per topic using GATE-01
- [ ] GATE-07 Faculty warning before risky changes (stretch)
  - Files: service, `SubjectSettings.jsx` · Done when: before saving a new passing % the UI shows how many students will change state (counts from a dry-run endpoint)
- [ ] GATE-08 Faculty manual unlock for one student (stretch)
  - Files: migration `005_topic_overrides.sql`, service, UI · Done when: faculty can unlock a topic for a named student; shown in the progress view; logged with who and when

## Frontend

- [x] GATE-09 State visuals and labels
  - Files: `src/components/TopicCard.jsx`, `StatusBadge.jsx`, `src/index.css` · Done when: each state has icon, label and style; `scheduled` and `locked` are grayed and `aria-disabled`; contrast passes WCAG AA for text on gray
- [x] GATE-10 Flow after a quiz
  - Files: `src/pages/student/TopicView.jsx`, `QuizRun.jsx` · Done when: passed → "Continue to next topic" (only if it is open); failed → "Repeat this topic" scrolls to the content and offers retake; pending → clear waiting message
- [x] GATE-11 Friendly handling of blocked direct URLs
  - Files: `TopicView.jsx`, `src/api/client.js` · Done when: `TOPIC_NOT_AVAILABLE` and `TOPIC_LOCKED` render a page with the reason, the date or blocking topic, and a back link
- [x] GATE-12 Faculty progress view (@kilo, 2026-11-04)
  - Files: `src/pages/faculty/Roster.jsx`, `src/api/subjects.js`, `src/index.css` · Done when: grid of students × topics with state icons; filters for "failed" and "pending"

## Phase verification

- [x] GATE-V1 Student fails topic 1 quiz: topic 2 shows locked with the reason; API call to topic 2 returns `403 TOPIC_LOCKED` (@kilo, 2026-11-05)
- [x] GATE-V2 Student passes: topic 2 opens (only if its date has arrived; otherwise it shows scheduled) (@kilo, 2026-11-05)
- [x] GATE-V3 Faculty lowers passing % to 50 (@kilo, 2026-11-05) → the failed student becomes completed and unlocked; raising it re-locks
- [ ] GATE-V4 Pending manual submission keeps the next topic locked until graded
- [x] GATE-V5 Past topics remain readable at all times (backtracking) (@kilo, 2026-11-05)
