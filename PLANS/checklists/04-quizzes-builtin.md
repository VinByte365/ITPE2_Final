# Phase 04 · Built-in Quizzes (R5)

Depends on: 03. Specs: `../specs/01-data-model.md` (004), `../specs/02-api.md` (Quizzes), `../specs/03-business-rules.md` (BR-01, BR-08 to BR-10), DEC-14 to DEC-16, DEC-20, DEC-27.
Until phase 06, "access to quiz" uses the schedule-only check from phase 03; GATE-04 replaces it.

## Backend

- [x] QUIZ-01 Migration `004_quizzes_attempts.sql` (@cline, 2026-11-01)
  - Files: `server/db/migrations/004_quizzes_attempts.sql` · Done when: idempotent; partial unique index allows only one open attempt per student per quiz; RLS enabled with no policies
- [x] QUIZ-02 Pure grading module (@cline, 2026-11-01)
  - Files: `server/services/grading.js`, `grading.test.js` · Done when: `normalizeText`, `gradeQuestion`, `gradeAttempt`, `isPassed` implemented per BR-01/BR-09; tests include boundary 7.5/10 at 75, 0 total, accented text, extra spaces, decimals points
- [x] QUIZ-03 Quiz and question validators (@cline, 2026-11-01)
  - Files: `server/validators/quiz.validator.js` · Done when: choice needs 2 to 6 options and one correct; text needs ≥ 1 accepted answer; prompt length limits; `points` > 0; import payload schema reports row-level errors
- [x] QUIZ-04 Quiz meta service and routes (`GET/PUT /faculty/topics/:id/quiz`) (@cline, 2026-11-01)
  - Files: `server/repositories/quizzes.repository.js`, `server/services/quizzes.service.js`, routes · Done when: one quiz per topic; mode locked once attempts exist
- [x] QUIZ-05 Question CRUD and reorder (@cline, 2026-11-01)
  - Files: repository, service, routes · Done when: server generates option ids; 21st question rejected; reorder transactional
- [x] QUIZ-06 Publish rules (@cline, 2026-11-01)
  - Files: service · Done when: built quiz publish with 9 or 21 questions → `422 QUIZ_QUESTION_COUNT`; deleting a question from a published quiz at 10 is rejected; publishing a quiz makes TOPIC-07 deletion rules apply
- [x] QUIZ-07 Bulk question import endpoint (@cline, 2026-11-01)
  - Files: service, route · Done when: atomic; any invalid row rejects everything with `details` per row; total over 20 rejected
- [x] QUIZ-08 Student start/resume attempt (@cline, 2026-11-01)
  - Files: `server/services/attempts.service.js`, routes · Done when: returns questions without answer keys; resumes `in_progress`; `max_attempts` enforced; unpublished quiz refused; student must be enrolled and topic accessible
- [x] QUIZ-09 Submit and grade (@cline, 2026-11-01)
  - Files: service, routes · Done when: server-side grading stores raw answers, `score`, `total`, status `graded`; second submit → `409 ATTEMPT_ALREADY_SUBMITTED`; response has `percent`, `passed`, `passingPercent`; `review` only when `show_answers` is true
- [x] QUIZ-10 Student attempt history with best score and pass flag (@cline, 2026-11-01)
  - Files: service, routes · Done when: pass flag uses the subject's current passing percent
- [x] QUIZ-11 Regrade endpoint (@cline, 2026-11-01)
  - Files: service, route · Done when: after editing a correct answer, regrade updates affected attempts and reports counts; manual attempts untouched
- [x] QUIZ-12 Tests with a fake repository (@cline, 2026-11-01)
  - Files: `server/**/*.test.js` · Done when: start, resume, submit, double submit, max attempts, answer-key leakage, publish limits, regrade covered

## Frontend

- [x] QUIZ-13 Faculty quiz builder `/faculty/topics/:id/quiz` (@cline, 2026-11-01)
  - Files: `src/pages/faculty/QuizBuilder.jsx`, `src/components/QuestionEditor.jsx`, `src/api/quizzes.js` · Done when: choice editor (add/remove options, mark correct), text editor (accepted answers as chips), counter "12/20, minimum 10 to publish", reorder, delete with confirmation, publish disabled with the reason shown, Regrade button
- [x] QUIZ-14 CSV import UI and template (@kilo, 2026-11-04)
  - Files: `src/components/QuestionImport.jsx`, `public/question-template.csv` · Done when: columns `type,question,optionA..optionF,correct,acceptedAnswers,points`; preview table flags invalid rows; confirm posts; template downloads; accented characters survive
- [x] QUIZ-15 Student `QuizRunner` (@cline, 2026-11-01)
  - Files: `src/components/QuizRunner.jsx`, `src/pages/student/QuizRun.jsx` · Done when: all questions on one scrolling page (Google Forms style); radio for choice, text input for text; unanswered count shown before submit; double submit prevented; progress kept if the page reloads (resumes attempt)
- [x] QUIZ-16 Result screen and attempt history (@cline, 2026-11-01)
  - Files: `src/pages/student/QuizRun.jsx`, `TopicView.jsx` · Done when: shows score, percent, passing mark, Passed/Failed badge (icon + text); failed shows "Repeat topic" and retake; history list lists attempts with best marked
- [x] QUIZ-17 Docs (@lms-researcher, 2026-11-03)
  - Files: `../specs/02-api.md`, `docs/API.md` · Done when: match the implementation

## Phase verification

- [ ] QUIZ-V1 Build a 10-question quiz (mix of choice and text); publish is blocked at 9 and works at 10; a 21st question is refused
- [ ] QUIZ-V2 Import 12 questions from the CSV template, one with `ñ`; bad rows are reported clearly
- [ ] QUIZ-V3 Student takes the quiz; inspect network responses: no answer keys anywhere
- [ ] QUIZ-V4 Score 8/10 at passing 75 → Passed; change the passing % to 90 → the same attempt now shows Failed without any other action
- [ ] QUIZ-V5 Faculty fixes a wrong key, presses Regrade, the student's score changes
