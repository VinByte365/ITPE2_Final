# Phase 09 · UI Alignment and Lint Health

Depends on: 04 (quiz UI), 05 (upload UI), 07 (report UI).
Specs: `../specs/04-frontend.md` (Design system, UI rules), `../AGENT.md`.

This phase exists because phases 01–07 were built before the design system was written down.
The LMS pages use classes that do not exist in `src/index.css` (`page-shell`, `subject-card`,
`status-badge`, `button`, `auth-page`, `auth-error`), hardcoded Tailwind-style colours, and static
inline styles. Closing this phase makes the LMS visually continuous with the public site.

## Lint

- [ ] UI-01 Restore a clean lint run
  - Files: `server/services/attempts.service.js`, `src/components/QuestionImport.jsx`, `src/components/UploadSubmission.jsx`, `src/pages/faculty/GradingQueue.jsx` · Done when: `npm.cmd run lint` reports 0 errors; remaining warnings are fixed or recorded in `DECISIONS.md`

## Design system

- [ ] UI-02 Align `StatusBadge` and shared primitives with the design system
  - Files: `src/components/StatusBadge.jsx`, `src/components/Icons.jsx`, `src/index.css` · Done when: no raw hex values; state colours come from palette tokens; icons come from `Icons.jsx`; every class resolves in `index.css`

- [ ] UI-03 Remove static inline styles from LMS pages
  - Files: `src/pages/faculty/QuizBuilder.jsx`, `GradingQueue.jsx`, `TopicEditor.jsx`, `Topics.jsx`, `src/pages/student/QuizRun.jsx`, `TopicView.jsx` · Done when: `style={{}}` remains only for genuinely dynamic values; every new class is defined in `index.css`

- [ ] UI-04 Replace undefined layout classes
  - Files: LMS pages using `page-shell`, `subject-card`, `subject-grid`, `auth-page`, `auth-error`, `button` · Done when: every `className` resolves to a selector; `button` is `.btn`

- [ ] UI-05 Responsive and keyboard sweep
  - Files: all LMS pages · Done when: usable at 360 px; focus ring visible; `aria-disabled` on non-actionable items; no horizontal scroll

## Phase verification

- [ ] UI-V1 Visual parity check
  - Done when: side-by-side screenshots of `HomePage`, `TopicsPage`, and three LMS pages show the same type scale, palette, and spacing language
