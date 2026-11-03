# Phase 07 · Reports and Exports (R6, R7)

Depends on: 06. Specs: `../specs/05-reports.md`, `../specs/03-business-rules.md` (BR-14), DEC-21.

## Backend

- [x] RPT-01 Pure `buildReport()` and the report endpoint
  - Files: `server/services/report.service.js`, `report.service.test.js`, repository, routes · Done when: shape matches the spec; tests cover sorting by surname (including `Ñ`, hyphens, case), by score both directions, ties, missing quizzes counted as 0, students with no quizzes last, passing % changes
- [x] RPT-02 Per-student scores endpoint
  - Files: service, routes · Done when: returns each quiz with every attempt (date, score, total, percent, source, result) and best; only for the owning faculty
- [x] RPT-03 Student own grades endpoint
  - Files: service, routes · Done when: only the student's own data; no answer keys; includes average and remark
- [ ] RPT-04 Performance check
  - Files: repository, migrations (indexes if needed) · Done when: 100 students × 16 quizzes responds in under 1 s locally; `EXPLAIN` shows indexes used

## Frontend

- [ ] RPT-05 Shared pure helpers
  - Files: `src/lib/reportTable.js`, `reportTable.test.js` (use `node --test`) · Done when: `toTable(report, options)` and the live pass/fail recompute function exist and are tested; same logic is used by preview and every exporter
- [ ] RPT-06 Report preview page
  - Files: `src/pages/faculty/Report.jsx`, `src/api/reports.js` · Done when: header block, sort controls (surname/score, asc/desc), passing % control with live recompute, column picker, failed shown with color plus symbol, footer totals, loading/empty/error states
- [ ] RPT-07 Print
  - Files: `src/lib/printReport.js`, `src/index.css` (`@media print`) · Done when: A4 landscape; controls and site chrome hidden; header repeats on each page; rows do not split; verified in Chrome and Firefox print preview
- [ ] RPT-08 PDF export
  - Files: `src/lib/exportPdf.js` · Done when: lazy-loaded; same columns and order as the preview; failed in red; page numbers; file name per spec; opens correctly
- [ ] RPT-09 Spreadsheet export (and CSV)
  - Files: `src/lib/exportXlsx.js`, `src/lib/exportCsv.js` · Done when: lazy-loaded; numbers stored as numbers; frozen header; failed fill; CSV has UTF-8 BOM and `ñ` survives; opens correctly in Excel and LibreOffice
- [ ] RPT-10 Per-student summary page
  - Files: `src/pages/faculty/StudentScores.jsx` · Done when: all quizzes and attempts for one student; Print, PDF and Excel buttons reuse the exporters; reachable from the roster and the report
- [ ] RPT-11 Student grades page
  - Files: `src/pages/student/Grades.jsx` · Done when: own scores, best per quiz, pass/fail, average and remark
- [ ] RPT-12 Export tests
  - Files: `*.test.js` · Done when: row arrays for report and per-student exports are covered; exports contain no ids or answer keys

## Phase verification

- [ ] RPT-V1 Seeded class of 40: sort by surname A–Z and Z–A, by score high–low and low–high; order is correct including `Ñ` names
- [ ] RPT-V2 Change passing % on the preview from 75 to 50; fails flip automatically; PDF, Excel and print all show the same values as the screen
- [ ] RPT-V3 Print a 40-student report: header repeats and rows are not cut across pages
- [ ] RPT-V4 Open the `.xlsx` in Excel or LibreOffice: numbers sort numerically; open the CSV: accents are correct
