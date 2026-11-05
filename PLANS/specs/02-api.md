# Spec 02 · API

Base: `/api/v1`. Follow `docs/API.md` conventions: `{ data }`, `{ data, meta }`, `{ error: { code, message, details }, requestId }`.
Validation errors `422`; malformed JSON `400`; unauthenticated `401`; wrong role/ownership `403`; missing `404`; conflicts `409`; rate limit `429`.
All routes below need a valid session unless marked **public**. Unless stated, JSON uses camelCase.

Roles: **S** student · **F** faculty (approved) · **A** admin. Faculty and student routes also verify ownership or enrollment (`06-security-storage.md`).
Legacy public content routes (`/content`, `/modules`, ...) are unchanged.

## Auth (extends existing)

| Method and path | Who | Body / notes |
| --- | --- | --- |
| `POST /auth/register` | public, rate-limited | `{ role: "student"\|"faculty", email, password, firstName, lastName, studentNumber? }`. `studentNumber` required for students. `201 { profile, requiresEmailConfirmation, pendingApproval }`. Sets no cookies. `409` if the email exists. |
| `POST /auth/login` `refresh` `logout` `forgot-password` | public | Existing. Profile now includes `firstName`, `lastName`, `studentNumber`, `approvalStatus`. |
| `GET /auth/me` | any | Existing, with the new profile fields. |
| `PATCH /auth/me` | any | `{ firstName?, lastName?, studentNumber? }` (student number editable only by admin once set) |
| `GET /admin/profiles?approvalStatus=pending&role=faculty` | A | Existing route plus filters. |
| `PATCH /admin/profiles/:id` | A | `{ role?, approvalStatus? }`. Existing last-admin and self-demotion protections stay. |

## Subjects and enrollment

| Method and path | Who | Notes |
| --- | --- | --- |
| `GET /faculty/subjects?status=active` | F | Own subjects with `studentCount`. |
| `POST /faculty/subjects` | F | `{ code, name, description?, term, schoolYear, passingPercent? }`. Generates `joinCode`. |
| `GET /faculty/subjects/:id` | F owner | |
| `PATCH /faculty/subjects/:id` | F owner | Any of `name, description, term, schoolYear, passingPercent, enrollmentOpen, status`. |
| `POST /faculty/subjects/:id/join-code` | F owner | Regenerates the join code. |
| `GET /faculty/subjects/:id/students` | F owner | Roster sorted by surname. |
| `DELETE /faculty/subjects/:id/students/:studentId` | F owner | Sets enrollment `removed`; attempts are kept. |
| `POST /student/enrollments` | S | `{ joinCode }`. Rate-limited. `404 JOIN_CODE_INVALID`, `403 ENROLLMENT_CLOSED`, `409 ALREADY_ENROLLED`. |
| `GET /student/subjects` | S | Enrolled, active subjects with progress counts. |
| `GET /student/subjects/:id` | S enrolled | Includes `passingPercent`, term, school year, faculty name. |

## Topics and content

| Method and path | Who | Notes |
| --- | --- | --- |
| `GET /faculty/subjects/:id/topics` | F owner | All topics (draft and published) with quiz summary. |
| `POST /faculty/subjects/:id/topics` | F owner | `{ title, description?, availableFrom, status? }`; position is appended. |
| `POST /faculty/subjects/:id/topics/bulk` | F owner | `{ count (1-40), startDate "YYYY-MM-DD", meetingDays [0-6] (Sun=0), titlePrefix? }` → creates draft topics "Topic N" with dates. Returns created topics. |
| `PUT /faculty/subjects/:id/topics/order` | F owner | `{ topicIds: [...] }` must be exactly the subject's topics. |
| `PATCH /faculty/topics/:id` | F owner | `title, description, availableFrom, status`. |
| `DELETE /faculty/topics/:id` | F owner | `409 TOPIC_HAS_ATTEMPTS` if any attempt exists. |
| `GET /faculty/topics/:id/content` | F owner | |
| `POST /faculty/topics/:id/content` | F owner | `{ type, title?, body?, url?, filePath?, fileName?, visibleToStudents?, position? }`. File must already exist in storage (verified). |
| `PATCH /faculty/content/:contentId` · `DELETE ...` | F owner | Deleting removes the storage object. |
| `POST /faculty/topics/:id/files/upload-url` | F owner | `{ fileName, mime, size }` → `{ uploadUrl, token, path }`. Validates type and size first. |
| `GET /student/subjects/:id/topics` | S enrolled | Published topics with `state`, `availableFrom`, `reason` (see BR-06). |
| `GET /student/topics/:id` | S enrolled | Content (faculty-only blocks removed) plus quiz summary. `403 TOPIC_NOT_AVAILABLE` (not yet scheduled; includes `availableFrom`) or `403 TOPIC_LOCKED` (includes `blockedByTopicId`). |
| `POST /student/topics/:id/complete` | S | Marks a quiz-less topic complete. No-op if the topic has a published quiz. |
| `GET /student/content/:contentId/download-url` | S | `{ url, expiresAt }`; same access rules as the topic. |

## Quizzes (faculty)

| Method and path | Notes |
| --- | --- |
| `GET /faculty/topics/:id/quiz` | Quiz with questions (including answer keys) or `null`. |
| `PUT /faculty/topics/:id/quiz` | Create or update meta: `title, mode, instructions, maxAttempts, showAnswers, totalItems, externalUrl, attachmentPath`. `mode` cannot change once attempts exist. |
| `PATCH /faculty/quizzes/:id` | `{ status: "published"\|"draft" }`. Publishing a `built` quiz needs 10 to 20 questions → `422 QUIZ_QUESTION_COUNT`; `uploaded` needs `totalItems`. |
| `POST /faculty/quizzes/:id/questions` | `{ type, prompt, options?, correctOptionIndex?, acceptedAnswers?, points? }`. `422` beyond 20 questions. Server generates option ids. |
| `PATCH /faculty/questions/:id` · `DELETE ...` | Delete is `422` if it would leave a published built quiz under 10. |
| `PUT /faculty/quizzes/:id/questions/order` | `{ questionIds }` |
| `POST /faculty/quizzes/:id/questions/import` | `{ questions: [...] }` atomic; whole payload rejected with row-level `details` if any row is invalid or the total exceeds 20. |
| `POST /faculty/quizzes/:id/regrade` | Recomputes score and total of all `auto` attempts from stored answers. Returns counts changed. |
| `POST /faculty/quizzes/:id/attachment/upload-url` | Same contract as topic files; for uploaded-mode quiz files. |
| `GET /faculty/topics/:id/ppt-sources` | Lists PPTX topic content blocks available for AI quiz generation. |
| `POST /faculty/topics/:id/quiz/generate-preview` | `{ contentBlockId, count? (10-20, default 10) }`. Parses PPTX server-side, generates MCQ draft questions via Groq, validates response; returns preview questions without persisting. Rate-limited. `503 AI_NOT_CONFIGURED`, `422 PPT_PARSE_FAILED`/`AI_GENERATION_FAILED`. |
| `POST /faculty/topics/:id/quiz/save-generated` | `{ questions }` (10-20 server-validated MCQs). Ensures built-in draft quiz and replaces questions only when quiz has no attempts; else `409 QUIZ_HAS_ATTEMPTS`. |

## Quiz taking (student, built-in)

| Method and path | Notes |
| --- | --- |
| `POST /student/quizzes/:id/attempts` | Starts or resumes an `in_progress` attempt. Gating enforced. `403 QUIZ_NOT_PUBLISHED`, `409 MAX_ATTEMPTS_REACHED`. Returns questions **without** answer keys. |
| `POST /student/attempts/:id/submit` | `{ answers: [{ questionId, optionId?, text? }] }`. Grades on the server; second submit `409`. Returns `{ score, total, percent, passed, passingPercent, review? }`. |
| `GET /student/quizzes/:id/attempts` | Own attempt history plus `best` and `passed`. |

## Quiz taking (student, uploaded)

| Method and path | Notes |
| --- | --- |
| `POST /student/quizzes/:id/uploads/upload-url` | `{ fileName, mime, size }` → `{ uploadUrl, token, path }` (JPG/PNG/WebP, ≤ 5 MB). |
| `POST /student/quizzes/:id/submissions` | `{ path }`. Verifies the object, creates an attempt `pending_review`. `409 PENDING_REVIEW_EXISTS`, `409 MAX_ATTEMPTS_REACHED`. |
| `DELETE /student/attempts/:id` | Only the student's own `pending_review` attempt; removes the image so they can resubmit. |
| `GET /student/attempts/:id/image-url` | Short-lived signed URL for own image. |

## Manual grading (faculty)

| Method and path | Notes |
| --- | --- |
| `GET /faculty/subjects/:id/submissions?status=pending_review&q=` | Queue with student name, topic, submitted time. |
| `GET /faculty/attempts/:id` | Attempt details plus signed image URL and quiz `totalItems`. |
| `PATCH /faculty/attempts/:id/grade` | `{ score, feedback? }`, `0 ≤ score ≤ totalItems`. Sets `graded`, `gradedBy`, `gradedAt`. May be repeated to correct a grade. |

## Progress and reports

| Method and path | Who | Notes |
| --- | --- | --- |
| `GET /faculty/subjects/:id/progress` | F owner | Per student, per topic `state`. |
| `GET /faculty/subjects/:id/report?sort=surname\|score&dir=asc\|desc` | F owner | See `05-reports.md` for the shape. |
| `GET /faculty/subjects/:id/students/:studentId/scores` | F owner | All quizzes with every attempt. |
| `GET /student/subjects/:id/grades` | S enrolled | Own scores, best per quiz, pass/fail, average. |

## Error codes introduced

`APPROVAL_PENDING` (403) · `ROLE_FORBIDDEN` (403) · `NOT_SUBJECT_OWNER` (403) · `NOT_ENROLLED` (403) ·
`TOPIC_NOT_AVAILABLE` (403) · `TOPIC_LOCKED` (403) · `QUIZ_NOT_PUBLISHED` (403) · `JOIN_CODE_INVALID` (404) ·
`ENROLLMENT_CLOSED` (403) · `ALREADY_ENROLLED` (409) · `MAX_ATTEMPTS_REACHED` (409) · `PENDING_REVIEW_EXISTS` (409) ·
`ATTEMPT_ALREADY_SUBMITTED` (409) · `TOPIC_HAS_ATTEMPTS` (409) · `QUIZ_QUESTION_COUNT` (422) · `UPLOAD_INVALID` (422) ·
`AI_NOT_CONFIGURED` (503) · `PPT_PARSE_FAILED` (422) · `AI_GENERATION_FAILED` (422) · `ORIGIN_NOT_ALLOWED` (403).

Whenever an endpoint is implemented or changed, update this file in the same commit.
