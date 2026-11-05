# Phase 03 · Topics and Content (R3, R4, X3)

Depends on: 02. Specs: `../specs/01-data-model.md` (003), `../specs/02-api.md` (Topics), `../specs/03-business-rules.md` (BR-03, BR-04, BR-13), `../specs/06-security-storage.md` (Uploads).
Note: until phase 06, student topic states are **schedule-only** (`scheduled` or `open`). GATE-03 replaces this.

## Backend

- [x] TOPIC-01 Migration `003_topics_content.sql` (@cline, 2026-10-31)
  - Files: `server/db/migrations/003_topics_content.sql` · Done when: idempotent; deferrable unique `(subject_id, position)`; RLS enabled with no policies
- [x] TOPIC-02 Storage helper (@cline, 2026-10-31)
  - Files: `server/lib/storage.js`, `storage.test.js` · Done when: `createUploadUrl`, `createDownloadUrl`, `objectInfo`, `removeObject`, `buildObjectPath` exist; path builder tested (no user-controlled path segments, sanitized names)
- [x] TOPIC-03 Upload validation helpers (@cline, 2026-10-31)
  - Files: `server/utils/uploads.js`, `uploads.test.js` · Done when: allow-lists by kind, size limits from env, filename sanitizer, image magic-byte check; tests cover spoofed extensions
- [x] TOPIC-04 Topic validators, repository, service, routes (single create, list, update, delete) (@cline, 2026-10-31)
  - Files: `server/validators/topic.validator.js`, `server/repositories/topics.repository.js`, `server/services/topics.service.js`, `server/routes/faculty.routes.js` · Done when: position appended; owner checks via subject; delete rule left for TOPIC-07
- [x] TOPIC-05 Schedule generator (pure) and bulk create endpoint (@cline, 2026-10-31)
  - Files: `server/utils/schedule.js`, `schedule.test.js`, service, route · Done when: BR-13 satisfied and tested for Manila midnight, weekdays, month/year boundaries, count 1 and 40; bulk insert in one transaction; positions continue after existing topics
- [x] TOPIC-06 Reorder endpoint (@cline, 2026-10-31)
  - Files: service, route · Done when: transactional with the deferred unique constraint; rejects id lists that are not exactly the subject's topics
- [x] TOPIC-07 Publish/unpublish and delete rules (@cline, 2026-10-31)
  - Files: service · Done when: `409 TOPIC_HAS_ATTEMPTS` is returned once attempts exist (stubbed until phase 04, covered by a test using a fake repository)
- [x] TOPIC-08 Content block validators, repository, service, routes (@cline, 2026-11-01)
  - Files: `server/validators/content.validator.js`, `server/repositories/content-blocks.repository.js`, services, routes · Done when: per-type rules (text/summary/notes need a body; presentation needs url or file; video needs url); URLs pass `utils/url.js`; ordered by `position`
- [x] TOPIC-09 Upload-URL endpoint and file verification on create (@cline, 2026-11-01)
  - Files: routes, service · Done when: wrong type/size rejected before a URL is issued; create verifies the object exists and the path prefix; deleting a block deletes the object
- [x] TOPIC-10 Student topic list (@cline, 2026-11-01)
  - Files: `server/services/student-topics.service.js`, routes · Done when: returns published topics only with `state` ∈ {`scheduled`,`open`}, `availableFrom`; sorted by position
- [x] TOPIC-11 Student topic detail, download URL, complete (@cline, 2026-11-01)
  - Files: service, routes · Done when: `403 TOPIC_NOT_AVAILABLE` for future topics (with `availableFrom`); faculty-only blocks and drafts never returned; `POST complete` records `topic_progress` idempotently
- [x] TOPIC-12 Tests (@cline, 2026-11-01)
  - Files: `server/**/*.test.js` · Done when: scheduling, ownership, enrollment and access rules covered

## Frontend

- [x] TOPIC-13 Shared components `MarkdownView` and `SlidesEmbed` (@cline, 2026-11-01)
  - Files: `src/components/MarkdownView.jsx`, `SlidesEmbed.jsx` (extract from `ModuleDetailPage.jsx`) · Done when: no raw HTML rendering; Google Slides link embedded, PDF embedded, `.pptx` offered as download; the legacy module page still works
- [x] TOPIC-14 Faculty topics page (@cline, 2026-11-01)
  - Files: `src/pages/faculty/Topics.jsx`, `src/api/topics.js` · Done when: list with date, status badge and content/quiz indicators; add one; bulk dialog (count, start date, weekday checkboxes, preview of generated dates before saving); up/down reorder; publish toggle
- [x] TOPIC-15 Topic editor (@cline, 2026-11-01)
  - Files: `src/pages/faculty/TopicEditor.jsx`, `src/components/FileUpload.jsx` · Done when: edit title, description, date; add/edit/delete/reorder blocks of each type; markdown preview; upload with progress and size/type errors; faculty-only toggle for notes
- [x] TOPIC-16 Student subject page (@cline, 2026-11-01)
  - Files: `src/pages/student/SubjectTopics.jsx`, `src/components/TopicCard.jsx`, `StatusBadge.jsx` · Done when: scheduled topics are grayed, labelled "Opens {date}", not clickable; open topics link through; passing % visible
- [x] TOPIC-17 Student topic page (@cline, 2026-11-01)
  - Files: `src/pages/student/TopicView.jsx` · Done when: blocks rendered in order; presentation viewable; video links work; "Mark as done" (or automatic call) for quiz-less topics; friendly screen for `TOPIC_NOT_AVAILABLE`

## Phase verification

- [ ] TOPIC-V1 Generate 12 topics (Tue/Thu from a chosen date); dates are right; reorder and edit one date
- [x] TOPIC-V2 Student sees past topics open and future topics grayed; opening a future topic by URL is refused (@kilo, 2026-11-05)
- [ ] TOPIC-V3 Upload a PDF presentation and a Google Slides link; both display; a `.exe` renamed `.pdf` is rejected
- [ ] TOPIC-V4 Faculty-only note is invisible to the student; draft topic is invisible to the student
