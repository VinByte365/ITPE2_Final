# Phase 05 · Uploaded Quizzes with Manual Grading (R5, confirmed flow)

Depends on: 04 (shares the `quizzes` and `attempts` tables). Specs: `../specs/02-api.md` (Quiz taking uploaded, Manual grading), `../specs/03-business-rules.md` (BR-11), `../specs/06-security-storage.md` (Uploads), DEC-17.
Flow: the student takes the quiz elsewhere, uploads an image showing the score, faculty type the grade.

## Backend

- [x] UPL-01 Uploaded-mode quiz meta and publish rule
  - Files: `server/services/quizzes.service.js`, validators · Done when: `mode: uploaded` requires `totalItems` ≥ 1; no 10 to 20 rule; `externalUrl` validated; optional attachment path verified; publish allowed with just a total
- [x] UPL-02 Quiz attachment upload-url endpoint (faculty)
  - Files: routes, service · Done when: PDF, image or text up to 25 MB accepted; others rejected
- [x] UPL-03 Student upload-url endpoint
  - Files: `server/routes/student.routes.js`, service · Done when: only JPG/PNG/WebP up to 5 MB; student enrolled and topic accessible; rate limit active; path built server-side
- [x] UPL-04 Create submission
  - Files: `server/services/attempts.service.js` · Done when: path prefix and object verified, magic bytes checked, attempt created as `pending_review` with `source = manual`; `409 PENDING_REVIEW_EXISTS` and `MAX_ATTEMPTS_REACHED` work; invalid files are deleted and return `422 UPLOAD_INVALID`
- [x] UPL-05 Delete pending submission and student image-url
  - Files: service, routes · Done when: only the owner's `pending_review` attempt can be removed; the object is deleted; signed URL issued only to the owner or the subject's faculty
- [x] UPL-06 Faculty submissions queue and detail
  - Files: service, routes · Done when: filter by status and student name; includes student name, topic, submitted time; detail returns a signed image URL and `totalItems`
- [x] UPL-07 Grade endpoint
  - Files: service, route, validator · Done when: score within 0 to `totalItems` with up to 2 decimals; sets `graded`, `total`, `graded_by`, `graded_at`; re-grading allowed; only the subject's faculty (or admin); unit tests for bounds and ownership
- [x] UPL-08 Orphan cleanup script (@kilo, 2026-11-04)
  - Files: `server/scripts/cleanup-orphans.js`, `package.json` (`storage:cleanup`) · Done when: lists storage objects with no matching attempt/content row older than 24 h; dry-run by default, deletes only with `--apply`

## Frontend

- [x] UPL-09 Faculty uploaded-quiz settings
  - Files: `src/pages/faculty/QuizBuilder.jsx` · Done when: choose "Built-in" or "Uploaded"; uploaded mode shows total items, instructions, external link, attachment upload; switching mode is blocked after attempts exist with an explanation
- [x] UPL-10 Student `UploadSubmission` component
  - Files: `src/components/UploadSubmission.jsx`, `FileUpload.jsx` · Done when: restricted `accept`, camera allowed on phones, client-side downscale and JPEG re-encode, preview, progress bar, replace while pending, clear error messages; shows the faculty's instructions, link and attachment
- [x] UPL-11 Student status display (@kilo, 2026-11-04)
  - Files: `TopicView.jsx`, `StatusBadge.jsx` · Done when: Pending review, Graded (score, percent, pass/fail, feedback), history of attempts
- [x] UPL-12 Faculty grading queue `/faculty/subjects/:id/grading`
  - Files: `src/pages/faculty/GradingQueue.jsx`, `src/components/ImageViewer.jsx` · Done when: pending badge count; viewer with zoom, rotate and open-full-size; score field with total shown and validated; Save, then "Save and next"; feedback optional; already graded items can be corrected
- [x] UPL-13 Docs (@kilo, 2026-11-05)
  - Files: specs and `docs/API.md` · Done when: match the implementation

## Phase verification

- [x] UPL-V1 Student uploads a phone photo over 5 MB; it is downscaled and accepted; a 12 MB PDF is rejected before upload starts (@kilo, 2026-11-05)
- [x] UPL-V2 Student cannot see another student's image URL; a second faculty cannot grade it (@kilo, 2026-11-05)
- [x] UPL-V3 Faculty grades 17/20 at passing 75 → Passed; student sees the result and feedback (@kilo, 2026-11-05)
- [x] UPL-V4 Student replaces a pending submission; the old object is gone from storage (@kilo, 2026-11-05)
