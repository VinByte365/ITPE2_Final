# Phase 02 · Subjects and Enrollment (R2, X1)

Depends on: 01. Specs: `../specs/01-data-model.md` (002), `../specs/02-api.md` (Subjects), `../specs/03-business-rules.md` (BR-02, BR-12), DEC-04, DEC-05.

## Backend

- [x] SUBJ-01 Migration `002_subjects_enrollments.sql` (RLS enabled, no policies) (@cline, 2026-10-31)
  - Files: `server/db/migrations/002_subjects_enrollments.sql` · Done when: idempotent; anon-key REST read of both tables returns nothing
- [x] SUBJ-02 Join-code generator (@cline, 2026-10-31)
  - Files: `server/utils/joinCode.js`, `joinCode.test.js` · Done when: 8 chars from the allowed alphabet; uses `crypto.randomInt`; tests check alphabet, length, and distribution sanity
- [x] SUBJ-03 Subject validators (@cline, 2026-10-31)
  - Files: `server/validators/subject.validator.js` · Done when: code upper-cased and pattern-checked; term enum; school year `YYYY-YYYY` with consecutive years; passing percent integer 1 to 100
- [x] SUBJ-04 Subject repository, service, routes (faculty CRUD) and `requireSubjectOwner` (@cline, 2026-10-31)
  - Files: `server/repositories/subjects.repository.js`, `server/services/subjects.service.js`, `server/routes/faculty.routes.js`, `server/routes/index.js`, `server/middleware/auth.js` · Done when: faculty list only their own subjects; another faculty gets `404`; admin can read all; duplicate (code, term, year) → `409`
- [x] SUBJ-05 Join-code regeneration and enrollment open/close (@cline, 2026-10-31)
  - Files: service and routes · Done when: old code stops working immediately; unique violation retried
- [x] SUBJ-06 Student enrollment endpoint (@cline, 2026-10-31)
  - Files: `server/routes/student.routes.js`, `server/services/enrollments.service.js`, repository · Done when: valid code enrolls; invalid → `404 JOIN_CODE_INVALID`; closed → `403 ENROLLMENT_CLOSED`; duplicate → `409`; removed students can rejoin; rate limit active
- [x] SUBJ-07 Student subject list/detail, faculty roster, remove student (@cline, 2026-10-31)
  - Files: service and routes · Done when: roster sorted by surname; removed student loses access but attempts remain in the database
- [x] SUBJ-08 Passing percent update through `PATCH /faculty/subjects/:id` (@cline, 2026-10-31)
  - Files: service, validator · Done when: values outside 1 to 100 rejected; nothing is stored except the percent (BR-02)
- [x] SUBJ-09 Tests (@cline, 2026-10-31)
  - Files: `server/**/*.test.js` · Done when: ownership, enrollment rules and code generation covered

## Frontend

- [x] SUBJ-10 Faculty dashboard `/faculty` (@cline, 2026-10-31)
  - Files: `src/pages/faculty/Dashboard.jsx`, `src/api/subjects.js` · Done when: cards show code, name, term, school year, student count, join code with copy button; empty state invites creating a subject
- [x] SUBJ-11 Create subject and settings pages (@cline, 2026-10-31)
  - Files: `src/pages/faculty/SubjectNew.jsx`, `SubjectSettings.jsx`, `src/components/PassingPercentControl.jsx` · Done when: 50/75 presets plus custom; warning text from BR-02; regenerate code and open/close enrollment with confirmation; archive works
- [x] SUBJ-12 Roster page `/faculty/subjects/:id/students` (@cline, 2026-10-31)
  - Files: `src/pages/faculty/Roster.jsx` · Done when: sorted list with student number; remove with confirmation
- [x] SUBJ-13 Student dashboard and join page (@cline, 2026-10-31)
  - Files: `src/pages/student/Dashboard.jsx`, `JoinSubject.jsx` · Done when: code input auto-uppercases, trims, accepts paste; friendly errors for each failure code; joined subject appears immediately
- [x] SUBJ-14 Update `../specs/02-api.md` and `docs/API.md` (@cline, 2026-10-31)
  - Files: docs · Done when: endpoints match the real behaviour

## Phase verification

- [ ] SUBJ-V1 Faculty A creates `IT101 · 1st Semester · 2026-2027`; Faculty B cannot see or edit it
- [ ] SUBJ-V2 Student joins with the code; wrong code, closed enrollment and double join each show the right message
- [ ] SUBJ-V3 Regenerating the code breaks the old one; student already enrolled keeps access
- [ ] SUBJ-V4 Changing passing % from 75 to 50 and back saves and displays correctly
