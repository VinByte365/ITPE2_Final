# Spec 05 · Reports and Exports

## Report endpoint

`GET /faculty/subjects/:id/report?sort=surname|score&dir=asc|desc` (defaults `surname`, `asc`).

```json
{
  "data": {
    "subject": { "id": "…", "code": "IT101", "name": "…", "term": "1st Semester", "schoolYear": "2026-2027",
                  "passingPercent": 75, "faculty": "LASTNAME, Firstname" },
    "generatedAt": "2026-11-03T09:00:00.000Z",
    "quizzes": [ { "quizId": "…", "topicId": "…", "position": 1, "topicTitle": "Topic 1", "totalItems": 10 } ],
    "rows": [
      { "studentId": "…", "lastName": "Acosta", "firstName": "Girone", "studentNumber": "TUPT-23-0001",
        "scores": [ { "quizId": "…", "score": 8, "total": 10, "percent": 80, "passed": true, "attempts": 2, "source": "auto" } ],
        "passedCount": 5, "quizCount": 6, "average": 83.33, "remark": "Passed" }
    ],
    "summary": { "students": 40, "classAverage": 78.4, "passRate": 72.5 }
  }
}
```

A missing quiz result is `null`. Build it with a pure `buildReport()` function (BR-14) and test it. Pass flags use the
subject's **current** passing percent. The frontend may recompute pass/fail live when the faculty member changes the
passing % control on the preview (same pure function shared via a small module), then confirm by saving the subject setting.

## Preview page (required before any export)

Route `/faculty/subjects/:id/report`. This single preview is the source for print, PDF and Excel, so what faculty see is what they export.

- Header block: subject code and name, term, school year, passing %, faculty, generated date and time.
- Controls: sort by **Surname** (A–Z / Z–A) or **Score** (high–low / low–high); passing % control; column picker (topics to include).
- Table: `#`, Student number, Surname, First name, one column per quiz (`8/10 · 80%`, red when failed, `—` when missing), Average, Passed x/y, Remark.
- Footer: class average and pass rate; legend for colors and symbols.
- Failed cells use color **and** a symbol or text (accessibility).
- Buttons: **Print**, **Download PDF**, **Download Excel**, optional **CSV**.
- The per-student page (`RPT-10`) uses the same exporters with a different table: topic, quiz, every attempt (date, score, %, result), best.

## Exports

| Format | Library | Requirements |
| --- | --- | --- |
| Print | browser `window.print()` + `@media print` | A4 landscape, hide header/controls, repeat table header on every page, avoid splitting rows, show the header block and footer |
| PDF | `jspdf` + `jspdf-autotable` (lazy) | A4 landscape, same columns and order as the preview, red text for failed, page numbers "Page x of y", header block on page 1 |
| Excel | `exceljs` (lazy) | Sheet "Summary" with header rows then the table; frozen header row; failed cells light red fill; numeric cells stored as numbers (percent as number with `0.00`), not text; auto column widths |
| CSV | plain string builder | UTF-8 with BOM so Excel shows accents and `ñ` correctly |

File names: `{CODE}_{term-slug}_{SY}_report_{YYYYMMDD}.pdf|xlsx|csv` (e.g. `IT101_1st-semester_2026-2027_report_20261103.pdf`).
Build row arrays in one pure function `toTable(report, options)` used by every exporter and tested.
Exports must never include correct answers, other subjects' data, or internal ids.
