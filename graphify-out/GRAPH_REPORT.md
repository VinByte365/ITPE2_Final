# Graph Report - system  (2026-11-05)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 957 nodes · 2661 edges · 49 communities (38 shown, 11 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 34 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `e47d9740`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- App.jsx
- admin.service.js
- dbQuery
- auth.routes.js
- StatusBadge
- student.routes.js
- subjects.service.js
- report.service.js
- Icons.jsx
- deploy
- ref_node_assert
- topics.js
- faculty.routes.js
- scripts
- migrate.js
- devDependencies
- dependencies
- topics.service.js
- config.js
- content.service.js
- AppError
- get
- quiz.validator.js
- quizzes.js
- env.js
- app.js
- seed-lms.js
- client.js
- package.json
- student-topics.test.js
- pool.js
- storage.js
- subject.validator.js
- GradingQueue.jsx
- content.js
- UploadSubmission.jsx
- create-test-users.js
- vite
- cors
- exceljs
- express
- helmet
- jspdf-autotable
- morgan
- papaparse
- react-bootstrap@^2.10.10
- react-dom
- react-markdown
- vercel.json

## God Nodes (most connected - your core abstractions)
1. `AppError` - 98 edges
2. `dbQuery()` - 76 edges
3. `react` - 37 edges
4. `react-router-dom` - 35 edges
5. `App()` - 32 edges
6. `get()` - 30 edges
7. `post()` - 27 edges
8. `scripts` - 21 edges
9. `env` - 19 edges
10. `StatusBadge()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `reorderContentBlocks()` --calls--> `withTransaction()`  [EXTRACTED]
  server/repositories/content-blocks.repository.js → server/db/pool.js
- `reorderQuestions()` --calls--> `withTransaction()`  [EXTRACTED]
  server/repositories/quizzes.repository.js → server/db/pool.js
- `reorderTopics()` --calls--> `withTransaction()`  [EXTRACTED]
  server/repositories/topics.repository.js → server/db/pool.js
- `listAllAttemptsBySubject()` --indirect_call--> `mapAttempt()`  [INFERRED]
  server/repositories/progress.repository.js → server/utils/mappers.js
- `listAttemptsByStudentSubject()` --indirect_call--> `mapAttempt()`  [INFERRED]
  server/repositories/progress.repository.js → server/utils/mappers.js

## Import Cycles
- None detected.

## Communities (49 total, 11 thin omitted)

### Community 0 - "App.jsx"
Cohesion: 0.05
Nodes (78): react, react-router-dom, archiveSubject(), createSubject(), enroll(), getFacultyProgress(), getFacultySubject(), getStudentGrades() (+70 more)

### Community 1 - "admin.service.js"
Cohesion: 0.05
Nodes (81): zod@^4.6.7, zod, withTransaction(), conflict(), forbidden(), notFound(), unprocessable(), requireAdmin (+73 more)

### Community 2 - "dbQuery"
Cohesion: 0.08
Nodes (53): dbQuery(), createContentBlock(), deleteContentBlock(), findContentBlockById(), getNextPosition(), listContentBlocksByTopic(), reorderContentBlocks(), updateContentBlock() (+45 more)

### Community 3 - "auth.routes.js"
Cohesion: 0.10
Nodes (32): baseOptions(), clearAuthCookies(), getRefreshToken(), setAuthCookies(), getAuthClient(), authLimiter, enrollLimiter, passwordResetLimiter (+24 more)

### Community 4 - "StatusBadge"
Cohesion: 0.12
Nodes (28): getFacultyReport(), getStudentScores(), StatusBadge(), buildCsv(), buildFileName(), cellText(), escapeCsv(), exportCsv() (+20 more)

### Community 5 - "student.routes.js"
Cohesion: 0.11
Nodes (29): router, router, router, router, router, router, createStudentSubmission(), deletePendingSubmission() (+21 more)

### Community 6 - "subjects.service.js"
Cohesion: 0.15
Nodes (28): countStudents(), createEnrollment(), createSubject(), findEnrollment(), findSubjectById(), findSubjectByJoinCode(), listAllSubjects(), listEnrollmentsBySubject() (+20 more)

### Community 7 - "report.service.js"
Cohesion: 0.13
Nodes (18): gradeManualAttempt(), submitAttempt(), computePercent(), gradeAttempt(), gradeQuestion(), isPassed(), normalizeText(), computeTopicStates() (+10 more)

### Community 8 - "Icons.jsx"
Cohesion: 0.17
Nodes (24): importQuestions(), startAttempt(), submitAttempt(), completeTopic(), getStudentTopic(), listStudentTopicContent(), BookIcon(), CheckIcon() (+16 more)

### Community 9 - "deploy"
Cohesion: 0.08
Nodes (26): runs-on, steps, environment, needs, runs-on, steps, name, url (+18 more)

### Community 10 - "ref_node_assert"
Cohesion: 0.08
Nodes (10): fakeAttemptsRepo, fakeQuizzesRepo, fakeSubjectsRepo, fakeTopicsRepo, state, fakeQuizzesRepo, fakeSubjectsRepo, fakeTopicsRepo (+2 more)

### Community 11 - "topics.js"
Cohesion: 0.18
Nodes (21): del(), removeStudent(), createContentBlock(), createTopic(), deleteContentBlock(), deleteTopic(), getUploadUrl(), listFacultyTopics() (+13 more)

### Community 12 - "faculty.routes.js"
Cohesion: 0.21
Nodes (19): checkTopicOwner(), createQuestion(), deleteQuestion(), deps, genOptionId(), getQuiz(), getQuizAttachmentUploadUrl(), importQuestions() (+11 more)

### Community 13 - "scripts"
Cohesion: 0.10
Nodes (21): scripts, build, db:migrate, db:schema, db:seed, db:seed:lms, db:seed:test-users, deploy (+13 more)

### Community 14 - "migrate.js"
Cohesion: 0.12
Nodes (14): dir, files, root, rows, table, target, dir, files (+6 more)

### Community 15 - "devDependencies"
Cohesion: 0.12
Nodes (19): devDependencies, concurrently@^10.0.6, eslint@^9.39.1, @eslint/js@^9.39.1, eslint-plugin-react-hooks@^7.0.1, eslint-plugin-react-refresh@^0.4.24, gh-pages@^6.3.0, globals@^16.5.0 (+11 more)

### Community 16 - "dependencies"
Cohesion: 0.10
Nodes (20): dependencies, bootstrap@^5.3.8, compression@^1.8.2, cookie-parser@^1.4.7, @emotion/react@^11.14.0, jspdf@^4.2.1, @mui/icons-material@^7.3.7, @mui/material@^7.3.7 (+12 more)

### Community 17 - "topics.service.js"
Cohesion: 0.17
Nodes (14): bulkCreateTopics(), createTopic(), deleteTopic(), deps, listTopics(), reorderTopics(), requireSubjectOwnerCheck(), rescheduleTopicsFromStart() (+6 more)

### Community 18 - "config.js"
Cohesion: 0.19
Nodes (12): pg, databaseConfigured, getPgConfig(), getSslConfig(), client, apply, isExpired(), listAllFiles() (+4 more)

### Community 19 - "content.service.js"
Cohesion: 0.15
Nodes (14): checkOwnership(), createContentBlock(), deleteContentBlock(), deps, getUploadUrl(), listContent(), reorderContentBlocks(), setDeps() (+6 more)

### Community 20 - "AppError"
Cohesion: 0.25
Nodes (12): getAccessToken(), AppError, asyncHandler(), badRequest(), unauthorized(), verifyAccessToken(), authConfig, requireApproved() (+4 more)

### Community 21 - "get"
Cohesion: 0.20
Nodes (15): listProfiles(), updateProfile(), forgotPassword(), getMe(), login(), logout(), refreshToken(), register() (+7 more)

### Community 22 - "quiz.validator.js"
Cohesion: 0.15
Nodes (15): choiceQuestionSchema, createQuestionSchema, gradeAttemptSchema, importPayloadSchema, importQuestionSchema, optionSchema, pointsSchema, promptSchema (+7 more)

### Community 23 - "quizzes.js"
Cohesion: 0.32
Nodes (14): createQuestion(), deleteQuestion(), getFacultyQuiz(), getQuizAttachmentUploadUrl(), listQuestions(), regradeQuiz(), updateQuestion(), updateQuizStatus() (+6 more)

### Community 24 - "env.js"
Cohesion: 0.18
Nodes (9): allowedSameSite, env, nodeEnv, sameSite, supabaseConfigured, supabaseServiceConfigured, clientOptions, buckets (+1 more)

### Community 25 - "app.js"
Cohesion: 0.26
Nodes (9): corsOrigin(), createApp(), healthHandler(), checkDatabase(), errorHandler(), mapDatabaseError(), notFoundHandler(), originGuard() (+1 more)

### Community 26 - "seed-lms.js"
Cohesion: 0.18
Nodes (13): builtQuizId, client, facultyId, future(), main(), now, past(), pendingFacultyId (+5 more)

### Community 27 - "client.js"
Cohesion: 0.25
Nodes (11): API_BASE, ApiError, doRefresh(), getRefreshPromise(), isAuthPath(), parseResponse(), put(), request() (+3 more)

### Community 28 - "package.json"
Cohesion: 0.15
Nodes (12): dotenv@^18.0.9, @emotion/styled@^11.14.1, express-rate-limit@^8.7.2, name, overrides, vite, private, type (+4 more)

### Community 29 - "student-topics.test.js"
Cohesion: 0.18
Nodes (6): setDeps(), fakeProgressRepo, fakeQuizzesRepo, fakeSubjectsRepo, fakeTopicsRepo, state

### Community 30 - "pool.js"
Cohesion: 0.27
Nodes (6): closePool(), createPool(), getPool(), app, server, shutdown()

### Community 31 - "storage.js"
Cohesion: 0.36
Nodes (8): buildObjectPath(), createDownloadUrl(), createUploadUrl(), downloadObject(), objectInfo(), removeObject(), sanitizeFileName(), getServiceClient()

### Community 32 - "subject.validator.js"
Cohesion: 0.36
Nodes (7): createSubjectSchema, enrollSchema, passingPercentSchema, schoolYearSchema, subjectCodeSchema, termSchema, updateSubjectSchema

### Community 33 - "GradingQueue.jsx"
Cohesion: 0.39
Nodes (6): getFacultyAttemptDetail(), gradeFacultyAttempt(), listFacultySubmissions(), ArrowLeft(), ImageViewer(), GradingQueue()

### Community 34 - "content.js"
Cohesion: 0.43
Nodes (6): API_BASE, ApiError, fetchSiteContent(), normalizeModule(), normalizeTheme(), request()

### Community 35 - "UploadSubmission.jsx"
Cohesion: 0.46
Nodes (7): deletePendingAttempt(), getAttemptHistory(), getAttemptImageUrl(), getStudentUploadUrl(), submitQuizImage(), processImageFile(), UploadSubmission()

### Community 36 - "create-test-users.js"
Cohesion: 0.52
Nodes (6): findAuthUserByEmail(), fullName(), main(), upsertAuthUser(), upsertProfile(), USERS

### Community 37 - "vite"
Cohesion: 0.40
Nodes (4): vite@^8.0.0-beta.13, @vitejs/plugin-react@^5.1.1, vite, @vitejs/plugin-react

## Knowledge Gaps
- **11 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `App.jsx` to `GradingQueue.jsx`, `UploadSubmission.jsx`, `StatusBadge`, `Icons.jsx`, `topics.js`, `dependencies`, `get`, `quizzes.js`, `client.js`, `package.json`?**
  _High betweenness centrality (0.173) - this node is a cross-community bridge._
- **Should `App.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.05325260052786834 - nodes in this community are weakly interconnected._
- **Why does `react-router-dom` connect `App.jsx` to `GradingQueue.jsx`, `StatusBadge`, `Icons.jsx`, `topics.js`, `dependencies`, `quizzes.js`, `package.json`?**
  _High betweenness centrality (0.138) - this node is a cross-community bridge._
- **Should `admin.service.js` be split into smaller, more focused modules?**
  _Cohesion score 0.0537280701754386 - nodes in this community are weakly interconnected._
- **Why does `zod` connect `admin.service.js` to `subject.validator.js`, `auth.routes.js`, `faculty.routes.js`, `quiz.validator.js`, `app.js`, `package.json`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Should `dbQuery` be split into smaller, more focused modules?**
  _Cohesion score 0.0771478667445938 - nodes in this community are weakly interconnected._
- **Should `auth.routes.js` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._