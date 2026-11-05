# Systems Index API

Base URL in local development:

```text
http://localhost:4000/api/v1
```

The Vite dev server proxies `/api` to that API, so the frontend uses
`/api/v1` by default.

All responses are JSON.

## Response shape

Successful single-resource responses:

```json
{ "data": { "id": 1, "title": "Computer Hardware" } }
```

Successful collections add pagination metadata:

```json
{
  "data": [],
  "meta": { "total": 16, "limit": 100, "offset": 0 }
}
```

Errors:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Some of the submitted values are invalid.",
    "details": [{ "path": "title", "message": "Too small..." }]
  },
  "requestId": "..."
}
```

Every response includes an `X-Request-Id` header.

## Health

```http
GET /health
GET /api/v1/health
```

Returns `200` when Postgres is reachable and Supabase Auth is configured.
Returns `503` with `status: "degraded"` otherwise. The web app does not depend on
this endpoint; it falls back to bundled content when `/content` fails.

## Public endpoints

These endpoints only return published content. They do not require auth.

### `GET /content`

One request for the whole public site:

```json
{
  "data": {
    "modules": [],
    "themes": [],
    "stats": {
      "modules": 16,
      "presenters": 32,
      "themes": 4,
      "videos": 25
    }
  }
}
```

### `GET /modules`

Query parameters:

| Name | Type | Notes |
| --- | --- | --- |
| `q` | string | Searches title, description, summary, and presenter name |
| `theme` | string | Theme id, e.g. `foundations` |
| `presenter` | UUID | Only modules with that presenter |
| `limit` | integer | 1–100, default 100 |
| `offset` | integer | Default 0 |

`status` is intentionally ignored on public endpoints; only published modules
are returned.

### `GET /modules/:idOrSlug`

Accepts either the numeric module id or its slug:

```http
GET /api/v1/modules/1
GET /api/v1/modules/computer-hardware
```

### `GET /themes`

Returns the four course layers and the published module ids in each one.

### `GET /presenters`

Optional `q` query searches presenter names. Each presenter includes the
published modules they are attached to.

### `GET /stats`

Counts for published modules, distinct presenters, themes, and videos.

## Authentication

Auth is handled by Supabase Auth. The API never stores passwords.

### `POST /auth/login`

Request:

```json
{
  "email": "you@example.com",
  "password": "your-password"
}
```

Response `200`:

```json
{
  "data": {
    "user": {
      "id": "00000000-0000-0000-0000-000000000000",
      "email": "you@example.com",
      "emailConfirmedAt": "2026-10-30T12:00:00.000Z"
    },
    "profile": {
      "id": "00000000-0000-0000-0000-000000000000",
      "email": "you@example.com",
      "fullName": null,
      "role": "admin",
      "createdAt": "...",
      "updatedAt": "..."
    },
    "expiresAt": "2026-10-30T13:00:00.000Z"
  }
}
```

Two HttpOnly cookies are set:

- `si_access_token` — Supabase access token
- `si_refresh_token` — rotating refresh token

Browser clients should use `credentials: 'include'`:

```js
fetch('http://localhost:4000/api/v1/auth/me', {
  credentials: 'include',
});
```

### `POST /auth/refresh`

Reads the refresh cookie and rotates both tokens.

### `POST /auth/logout`

Clears both auth cookies.

### `GET /auth/me`

Requires a valid session. Returns the auth user and profile/role.

### `POST /auth/forgot-password`

Request:

```json
{ "email": "you@example.com" }
```

Always responds `202` so account existence is not disclosed. Supabase sends the
email using `PASSWORD_RESET_REDIRECT_URL`.

### Non-browser clients

The API also accepts `Authorization: Bearer <access-token>`. A bearer token can
come from a Supabase Auth client; the `/auth/login` endpoint sets HttpOnly
cookies instead of returning the token to JavaScript.

A cookie jar works for curl:

```bash
curl -c cookies.txt -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","password":"your-password"}'

curl -b cookies.txt http://localhost:4000/api/v1/auth/me
```

## Admin endpoints

All `/admin` routes require an authenticated profile with the `admin` or
`faculty` role. Profile role management requires `admin` specifically.

### Modules

```http
GET    /admin/modules
GET    /admin/modules/:id
POST   /admin/modules
PATCH  /admin/modules/:id
DELETE /admin/modules/:id
```

`GET /admin/modules` accepts `q`, `theme`, `presenter`, `status`, `limit`, and
`offset`. Unlike the public endpoint, it includes drafts and archived modules.

Create body:

```json
{
  "id": 17,
  "title": "Edge Computing",
  "slug": "edge-computing",
  "description": "A short description of the module.",
  "summary": "The written summary. **Bold** markers are preserved for the site.",
  "pptUrl": "https://docs.google.com/presentation/d/...",
  "themeId": "frontiers",
  "status": "draft",
  "videos": [
    { "url": "https://youtu.be/...", "label": "Discussion 01" }
  ],
  "presenterIds": ["00000000-0000-0000-0000-000000000000"]
}
```

Only `title`, `description`, and `themeId` are required. `id` is generated from
the next available number when omitted. A published module must have at least
one presenter.

Update body accepts any subset of the create fields except `id`. Sending
`videos` or `presenterIds` replaces the full collection.

Delete behavior:

```http
DELETE /admin/modules/17
```

Archives the module. To permanently delete:

```http
DELETE /admin/modules/17?hard=true
```

Hard deletes require the `admin` role.

### Replace a module's presenters

```http
PUT /admin/modules/:id/presenters
Content-Type: application/json

{ "presenterIds": ["uuid-a", "uuid-b"] }
```

Replaces the list in order. A published module cannot be left with zero
presenters.

### Videos

```http
POST   /admin/modules/:id/videos
PATCH  /admin/modules/:id/videos/:videoId
DELETE /admin/modules/:id/videos/:videoId
```

Create body:

```json
{ "url": "https://youtu.be/...", "label": "Discussion 02" }
```

Update body accepts `url`, `label`, and `position`.

### Presenters

```http
GET    /admin/presenters?q=acosta
POST   /admin/presenters
PATCH  /admin/presenters/:id
DELETE /admin/presenters/:id
```

Presenter names use the class format `LASTNAME, FIRSTNAME`:

```json
{ "name": "ACOSTA, GIRONE" }
```

Deleting a presenter attached to a published module returns `409`; remove them
from that module first.

### Profiles and roles

```http
GET   /admin/profiles
PATCH /admin/profiles/:id
```

Update body:

```json
{ "role": "faculty", "approvalStatus": "approved" }
```

Allowed roles: `admin`, `faculty`, `student`. Allowed approval statuses: `pending`, `approved`, `rejected`.

Business protections:

- An admin cannot demote themselves.
- The last remaining admin cannot be demoted.

## Quizzes

Quiz content hangs off a topic (`PUT /faculty/topics/:id/quiz`) and is published as a
quiz (`PATCH /faculty/quizzes/:id`). Faculty endpoints that read or write questions
return answer keys; student endpoints never do.

### Faculty quiz management

```http
GET    /faculty/topics/:id/quiz
PUT    /faculty/topics/:id/quiz
PATCH  /faculty/quizzes/:id
GET    /faculty/quizzes/:id/questions
POST   /faculty/quizzes/:id/questions
PATCH  /faculty/questions/:id
DELETE /faculty/questions/:id
PUT    /faculty/quizzes/:id/questions/order
POST   /faculty/quizzes/:id/questions/import
POST   /faculty/quizzes/:id/regrade
POST   /faculty/quizzes/:id/attachment/upload-url
GET    /faculty/topics/:id/ppt-sources
POST   /faculty/topics/:id/quiz/generate-preview
POST   /faculty/topics/:id/quiz/save-generated
```

`GET /faculty/topics/:id/quiz` responds `{ "data": quiz }` with the quiz and its
questions (including answer keys), or `{ "data": null }` when the topic has no quiz.

`PUT /faculty/topics/:id/quiz` creates or updates quiz meta: `title`, `mode`,
`instructions`, `maxAttempts`, `showAnswers`, `totalItems`, `externalUrl`,
`attachmentPath`. The `mode` cannot change once attempts exist.

`PATCH /faculty/quizzes/:id` accepts `{ "status": "draft" | "published" }`.
Publishing a `built` quiz requires 10 to 20 questions (`422 QUIZ_QUESTION_COUNT`);
publishing an `uploaded` quiz requires `totalItems`.

`POST /faculty/quizzes/:id/questions` accepts `{ type, prompt, options?, correctOptionIndex?, acceptedAnswers?, points? }`
(`type`: `choice` or `text`). The API allows at most 20 questions (`422` beyond).
Option ids are generated server-side. Responds `201` with `{ "data": question }`.

`PATCH /faculty/questions/:id` updates a question; `DELETE /faculty/questions/:id`
deletes one, `422` when a published built quiz would fall below 10 questions.

`PUT /faculty/quizzes/:id/questions/order` accepts `{ "questionIds": [uuid] }` and
returns the reordered question list.

`POST /faculty/quizzes/:id/questions/import` accepts `{ "questions": [...] }` and is
atomic: the whole payload is rejected with row-level `details` if any row is invalid or
the total exceeds 20.

`POST /faculty/quizzes/:id/regrade` recomputes `score` and `total` of all `auto` attempts
of the quiz from stored answers and returns `{ "data": { regraded, changed } }`.

`POST /faculty/quizzes/:id/attachment/upload-url` accepts `{ fileName, mime, size, kind? }`
and returns `{ "data": { uploadUrl, token, path } }` for uploaded-mode quiz attachments.

### AI quiz generation from topic PPTX

```http
GET  /faculty/topics/:id/ppt-sources
POST /faculty/topics/:id/quiz/generate-preview
POST /faculty/topics/:id/quiz/save-generated
```

These endpoints are faculty/admin only and server-side only. The client never receives
`GROQ_API_KEY` and the API never returns raw presentation text.

`GET /faculty/topics/:id/ppt-sources` returns PPTX topic content blocks (`presentation`
or `file`, `.pptx`) that can be used as generation sources.

`POST /faculty/topics/:id/quiz/generate-preview` accepts
`{ "contentBlockId": "<uuid>", "count": 10 }` where `count` is 10–20 (default 10).
It parses PPTX text from the selected topic content block, generates multiple-choice
draft questions via Groq, validates the response, and returns
`{ "data": { topicId, contentBlockId, fileName, questions } }`. Questions are not
persisted until save. This route is rate-limited.

`POST /faculty/topics/:id/quiz/save-generated` accepts
`{ "questions": [...] }` (server-validated, 10–20 MCQs, exactly 4 options). It ensures a
built-in draft quiz for the topic and replaces questions only when the quiz has no
attempts. If attempts exist, it returns `409 QUIZ_HAS_ATTEMPTS`.

Relevant errors: `503 AI_NOT_CONFIGURED` (missing `GROQ_API_KEY`), `422 PPT_PARSE_FAILED`,
`422 AI_GENERATION_FAILED`, `404` for missing/inaccessible topic or source block,
`409 QUIZ_HAS_ATTEMPTS`.

### Quiz taking (student, built-in)

```http
POST /student/quizzes/:id/attempts
POST /student/attempts/:id/submit
GET  /student/quizzes/:id/attempts
```

`POST /student/quizzes/:id/attempts` starts or resumes an `in_progress` attempt, with
gating enforced. Errors: `403 QUIZ_NOT_PUBLISHED`, `409 MAX_ATTEMPTS_REACHED`. Responds
`200` with `{ "data": { attempt, questions } }`; questions carry no answer keys.

`POST /student/attempts/:id/submit` accepts
`{ "answers": [{ "questionId", "optionId?", "text?" }] }`, grades on the server, and
responds `{ "data": { score, total, percent, passed, passingPercent, review? } }`.
A second submit returns `409 ATTEMPT_ALREADY_SUBMITTED`. `review` is only present when
`showAnswers` is true.

`GET /student/quizzes/:id/attempts` returns the student's own attempt history plus the
`best` attempt (highest percent, latest on ties) and the `passed` flag.

### Quiz taking (student, uploaded)

```http
POST /student/quizzes/:id/uploads/upload-url
POST /student/quizzes/:id/submissions
DELETE /student/attempts/:id
GET  /student/attempts/:id/image-url
```

`POST /student/quizzes/:id/uploads/upload-url` accepts `{ fileName, mime, size }` and
returns `{ "data": { uploadUrl, token, path } }`; accepts JPG/PNG/WebP up to 5 MB.

`POST /student/quizzes/:id/submissions` accepts `{ "path }` and verifies the object,
creating a `pending_review` attempt; conflicts: `409 PENDING_REVIEW_EXISTS`,
`409 MAX_ATTEMPTS_REACHED`.

`DELETE /student/attempts/:id` removes the student's own `pending_review` attempt.

`GET /student/attempts/:id/image-url` returns a short-lived signed URL for the student's
own `pending_review` attempt.

### Manual grading (faculty)

```http
GET  /faculty/subjects/:id/submissions?status=&q=
GET  /faculty/attempts/:id
PATCH /faculty/attempts/:id/grade
```

`GET /faculty/subjects/:id/submissions` lists the faculty queue with optional `status`
and `q` filters.

`GET /faculty/attempts/:id` returns attempt details plus a signed image URL and the
quiz's `totalItems`.

`PATCH /faculty/attempts/:id/grade` accepts `{ "score", "feedback?" }` with
`0 ≤ score ≤ totalItems`; sets `graded`, `gradedBy`, and `gradedAt`; may be repeated to
correct a grade.

## Common status codes

| Status | Meaning |
| --- | --- |
| `200` | Success |
| `201` | Created |
| `202` | Accepted (password reset) |
| `204` | CORS preflight success |
| `400` | Malformed JSON |
| `401` | Missing, invalid, or expired session |
| `403` | Role or origin not allowed |
| `404` | Resource or route not found |
| `409` | Duplicate record or business-rule conflict |
| `422` | Validation or reference error |
| `429` | Rate limited |
| `503` | Database or auth not configured/unavailable |
