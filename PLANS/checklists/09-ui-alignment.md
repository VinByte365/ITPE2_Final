# Phase 09 · UI Alignment and Lint Health

Depends on: 04 (quiz UI), 05 (upload UI), 07 (report UI).
Specs: `../specs/04-frontend.md` (Design system, UI rules), `../AGENT.md`.

This phase exists because phases 01–07 were built before the design system was written down.
The LMS pages use classes that do not exist in `src/index.css` (`page-shell`, `subject-card`,
`status-badge`, `button`, `auth-page`, `auth-error`), hardcoded Tailwind-style colours, and static
inline styles. Closing this phase makes the LMS visually continuous with the public site.

## Lint

- [x] UI-01 Restore a clean lint run (@lms-worker, 2026-11-03)
  - Files: `server/services/attempts.service.js`, `src/components/QuestionImport.jsx`, `src/components/UploadSubmission.jsx`, `src/pages/faculty/GradingQueue.jsx` · Done when: `npm.cmd run lint` reports 0 errors; remaining warnings are fixed or recorded in `DECISIONS.md`

## Design system

- [x] UI-02 Align `StatusBadge` and shared primitives with the design system (@lms-worker, 2026-11-03)
  - Files: `src/components/StatusBadge.jsx`, `src/components/Icons.jsx`, `src/index.css` · Done when: no raw hex values; state colours come from palette tokens; icons come from `Icons.jsx`; every class resolves in `index.css`

- ~~UI-03 Remove static inline styles from LMS pages~~
  - Replaced by UI-06 … UI-10. One task covering six pages and 197 `style={{}}` blocks was not
    reviewable in a single pass; each page now has its own task with its own diff.

- [x] UI-04 Define the shared layout primitives and remove undefined classes (@lms-worker, 2026-11-03)
  - Files: `src/index.css`, `src/components/SlidesEmbed.jsx`, and the markup in `src/auth/pages/*.jsx`, `src/pages/faculty/*.jsx`, `src/pages/student/*.jsx` · Done when: `page-shell`, `subject-card`, `subject-grid`, `subject-code`, `auth-page`, `auth-layout`, `auth-error`, `auth-info`, `field-error`, `input`, `password-field`, `filters`, `markdown-view` and `slides-embed` resolve to real selectors built from tokens; `button` / `button-primary` markup is `.btn` / `.btn-solid`; the static `style={{}}` on the `SlidesEmbed` iframes is gone; no LMS or auth `className` token is left undefined

- [ ] UI-05 Responsive and keyboard sweep
  - Files: all LMS pages · Done when: usable at 360 px; focus ring visible; `aria-disabled` on non-actionable items; no horizontal scroll

- [ ] UI-06 `QuizBuilder` inline styles (60)
  - Files: `src/pages/faculty/QuizBuilder.jsx`, `src/index.css` · Done when: static `style={{}}` blocks are gone; only genuinely dynamic values remain inline; every class resolves

- [ ] UI-07 `QuizRun` inline styles (38)
  - Files: `src/pages/student/QuizRun.jsx`, `src/index.css` · Done when: static `style={{}}` blocks are gone; progress and timer values may stay inline; every class resolves

- [ ] UI-08 `TopicView` inline styles (32)
  - Files: `src/pages/student/TopicView.jsx`, `src/index.css` · Done when: static `style={{}}` blocks are gone; every class resolves

- [ ] UI-09 `GradingQueue` inline styles (43)
  - Files: `src/pages/faculty/GradingQueue.jsx`, `src/index.css` · Done when: static `style={{}}` blocks are gone; every class resolves

- [ ] UI-10 `TopicEditor`, `Topics`, `JoinSubject`, `TopicsPage` inline styles (25)
  - Files: `src/pages/faculty/TopicEditor.jsx`, `src/pages/faculty/Topics.jsx`, `src/pages/student/JoinSubject.jsx`, `src/pages/TopicsPage.jsx`, `src/index.css` · Done when: static `style={{}}` blocks are gone; every class resolves

## Phase verification

- [ ] UI-V1 Visual parity check
  - Done when: side-by-side screenshots of `HomePage`, `TopicsPage`, and three LMS pages show the same type scale, palette, and spacing language
