# Phase 08 · Testing, Security and Deployment

Depends on: 07. Specs: `../specs/06-security-storage.md`, `../PLAN.md` (definition of done), DEC-22, DEC-24, OQ-01, OQ-03.

- [x] QA-01 Dev seed script (@kilo, 2026-11-04)
  - Files: `server/scripts/seed-lms.js`, `package.json` (`db:seed:lms`) · Done when: creates 1 approved faculty, 1 pending faculty, about 12 students (names with `Ñ` and hyphens), 1 subject, 8 topics (mixed past/future dates), a built quiz (12 questions), an uploaded quiz, sample attempts; refuses to run when `NODE_ENV=production`; documented
- [ ] QA-02 Manual QA matrix executed and recorded
  - Files: this file (tick the sub-items) · Done when: every item below passes and failures are logged in `HANDOFF-LOG.md`
  - [ ] QA-02a R1 register/login for faculty and student
  - [ ] QA-02b R2 subject with code, term, school year, join by code
  - [ ] QA-02c R3 schedule gating, grayed future topics, backtracking
  - [ ] QA-02d R4 text, presentation, summary, notes
  - [ ] QA-02e R5 built quiz (10 to 20), CSV import, uploaded quiz with manual grade
  - [ ] QA-02f R6 report preview, sorts, print, PDF, spreadsheet
  - [ ] QA-02g R7 per-student all-quiz summary
  - [ ] QA-02h X1 passing % change updates results everywhere
  - [ ] QA-02i X2 failed quiz blocks the next topic and the topic can be repeated
  - [ ] QA-02j X3 bulk (10 to 16) and single topic creation
- [ ] QA-03 Authorization sweep
  - Files: `server/scripts/authz-sweep.js` or `server/**/*.authz.test.js` · Done when: for every route, requests as anonymous, wrong role, other faculty and other student are denied with the expected status; table of results saved in `HANDOFF-LOG.md`
- [ ] QA-04 Security review
  - Files: various · Done when: rate limits verified on register, enroll, upload endpoints; `originGuard` active; no answer keys in student responses (grep network logs); anon-key REST read of every new table returns nothing; no secrets in the built bundle (`grep` of `dist/`); signed URLs expire; cookies `HttpOnly`, `Secure` in production
- [ ] QA-05 Performance and indexes
  - Files: migrations if needed · Done when: report, progress and topic list stay under 1 s with the seed data scaled to 100 students; slow queries have indexes
- [ ] QA-06 Mobile pass at 360 px
  - Files: `src/index.css`, pages · Done when: student dashboard, join, topic list, topic view, quiz runner and upload work with thumbs only; no horizontal scroll except tables in their own scroll container
- [ ] QA-07 Accessibility pass
  - Files: pages · Done when: keyboard-only use of login, quiz runner and upload works; focus visible; form errors announced; gray states pass contrast; labels on all inputs
- [ ] QA-08 Branding and the legacy site decision
  - Files: `index.html`, `src/pages/HomePage.jsx`, `AboutPage.jsx`, `SiteHeader.jsx`, `SiteFooter.jsx`, `public/og-cover.jpg` · Done when: product name per OQ-01; Home explains the LMS and links to login/register; legacy modules either kept under a clear section or removed with a migration note; page titles and Open Graph tags updated
- [ ] QA-09 Deployment
  - Files: `.github/workflows/deploy.yml`, `vercel.json`, `.env.example`, `README.md` · Done when: API host chosen and running with production env (`COOKIE_SECURE=true`, `TRUST_PROXY=true`, exact `CORS_ORIGIN`); frontend built with the right `VITE_API_BASE_URL`; the GitHub Pages workflow is removed or clearly limited to the legacy static site; cookie/domain setup verified with a real login
- [ ] QA-10 Documentation
  - Files: `README.md`, `docs/API.md`, `docs/GUIDE.md` · Done when: README describes the LMS (stack, setup, roles, scripts); API doc matches the code; a one-page guide each for faculty and students; "fallback to bundled data" language removed
- [ ] QA-11 Data privacy and backups note
  - Files: `README.md` or `docs/PRIVACY.md` · Done when: states what personal data is stored, who can see it, how to export/delete a student's data on request, and how backups are done in Supabase
- [ ] QA-12 Final acceptance
  - Files: `../PLAN.md` · Done when: all earlier checklists complete; `npm run lint`, `npm run build`, `npm test` pass on a clean clone; a release is tagged; sign-off recorded in `HANDOFF-LOG.md`
