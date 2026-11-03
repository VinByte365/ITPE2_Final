# Spec 04 · Frontend

React 19, React Router 7, Vite. Match the existing look (`src/index.css`, `Icons.jsx`, `Reveal.jsx`, `SiteHeader.jsx`).
Read `src/main.jsx` and `src/data/ContentProvider.jsx` first (HK-01).

## Approved new dependencies

| Package | Why | Notes |
| --- | --- | --- |
| `react-markdown` | Render text, summaries and notes | No raw HTML plugin. Links open with `rel="noopener noreferrer"`. |
| `papaparse` | CSV question import | Browser-side parsing. |
| `jspdf` + `jspdf-autotable` | PDF export | Load with dynamic `import()` on click. |
| `exceljs` | `.xlsx` export | Dynamic import. Do **not** use the `xlsx` npm package (the registry copy is stale and has known vulnerabilities). |

Anything else needs a `DECISIONS.md` entry first.

## Folder layout

```text
src/
├── api/
│   ├── client.js          # fetch wrapper (new)
│   ├── auth.js  subjects.js  topics.js  quizzes.js  reports.js
│   └── content.js         # legacy, unchanged
├── auth/
│   ├── AuthContext.jsx    # provider + useAuth()
│   ├── ProtectedRoute.jsx # <ProtectedRoute roles={['faculty']} />
│   └── pages/             # LoginPage, RegisterPage, ForgotPasswordPage, PendingApprovalPage
├── layouts/               # AppLayout (header + outlet), AuthLayout
├── pages/
│   ├── faculty/           # Dashboard, SubjectNew, SubjectSettings, Roster, Topics, TopicEditor,
│   │                      #   QuizBuilder, GradingQueue, Report, StudentScores
│   ├── student/           # Dashboard, JoinSubject, SubjectTopics, TopicView, QuizRun, Grades
│   └── admin/             # Users (approvals)
├── components/            # existing + StatusBadge, TopicCard, MarkdownView, SlidesEmbed, FileUpload,
│                          #   QuizRunner, QuestionEditor, ImageViewer, PassingPercentControl, ConfirmDialog
└── lib/                   # formatDate.js, exportPdf.js, exportXlsx.js, printReport.js
```

## API client contract (`src/api/client.js`)

- Always `credentials: 'include'`; base from `import.meta.env.VITE_API_BASE_URL ?? '/api/v1'`.
- Sends/receives JSON, unwraps `{ data, meta }`, throws `ApiError { status, code, message, details, requestId }`.
- On `401` from any call except `/auth/*`: call `/auth/refresh` once (single-flight so parallel calls share it), retry once,
  otherwise clear the user and redirect to `/login?next=…`.
- No retry on non-idempotent requests other than the 401 refresh. Never log request bodies.
- Uploads: `uploadToSignedUrl(url, file, onProgress)` using `XMLHttpRequest` or `fetch` as the signed-URL format requires.

## Auth behaviour

- `AuthContext` calls `/auth/me` on load. States: `loading | anonymous | authenticated`. Exposes `user`, `profile`, `login`, `logout`, `refreshProfile`.
- After login: admin → `/admin/users`, faculty → `/faculty`, student → `/student`, honoring `?next=` when safe (same-origin path only).
- Faculty with `approvalStatus = pending` is routed to `/pending-approval` from every `/faculty/*` route.
- `ProtectedRoute` shows nothing flashy while `loading`, then redirects or renders. It is a UX convenience only; the API enforces access.

## Routes

| Path | Who | Page |
| --- | --- | --- |
| `/login` `/register` `/forgot-password` `/pending-approval` | public | Auth pages |
| `/` `/topics` `/modules/:id` `/about` | public | Legacy site (until QA-08) |
| `/student` | S | Dashboard: my subjects, "Join subject" |
| `/student/join` | S | Enter join code |
| `/student/subjects/:id` | S | Topic list with states |
| `/student/topics/:id` | S | Topic content, quiz block, upload block |
| `/student/subjects/:id/grades` | S | My scores |
| `/faculty` | F | Subjects dashboard |
| `/faculty/subjects/new` | F | Create subject |
| `/faculty/subjects/:id` | F | Overview (redirect to topics) |
| `/faculty/subjects/:id/settings` | F | Passing %, join code, enrollment, archive |
| `/faculty/subjects/:id/students` | F | Roster |
| `/faculty/subjects/:id/topics` | F | Topic list, add one, bulk add, reorder, publish |
| `/faculty/topics/:id` | F | Topic editor (details and content blocks) |
| `/faculty/topics/:id/quiz` | F | Quiz builder |
| `/faculty/subjects/:id/grading` | F | Manual grading queue |
| `/faculty/subjects/:id/report` | F | Report preview, sort, export |
| `/faculty/subjects/:id/students/:studentId` | F | One student's scores |
| `/admin/users` | A | Approvals and roles |
| `*` | any | Existing 404 |

## UI rules

- **Never use the bundled-data fallback** for LMS pages. Show an error state with a Retry button.
- Every list has loading (skeleton or text), empty and error states. Destructive actions use `ConfirmDialog`.
- Mobile first: all student pages work at 360 px. Touch targets at least 44 px.
- Do not rely on color alone: topic states have an icon and text label as well; disabled items use `aria-disabled="true"`
  and are removed from the tab order when not actionable.
- Dates display in the subject's timezone using `Intl.DateTimeFormat` (e.g. "Tue, Nov 4, 2026").
- Forms: label every field, show field-level errors from `ApiError.details`, disable the submit button while pending.
- Markdown from users is rendered through `MarkdownView` only. Never use `dangerouslySetInnerHTML` with user content.
- Image upload (`UPL-10`): `accept="image/jpeg,image/png,image/webp"` (this also makes iOS convert HEIC to JPEG), downscale to
  at most 2000 px on the long edge with canvas, re-encode as JPEG quality 0.85, show a preview before sending.
