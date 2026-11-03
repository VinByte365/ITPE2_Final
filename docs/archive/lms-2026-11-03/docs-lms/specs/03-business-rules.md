# Spec 03 · Business Rules

These rules are the source of truth for grading, gating, scheduling and reports. Implement them as
**pure functions** (no database, no clock reads inside) and test them with `node --test`.

## BR-01 Passing

Scores are decimals with at most 2 places. Compare in hundredths to avoid float errors:

```js
passed = total > 0 && Math.round(score * 100) * 100 >= passingPercent * Math.round(total * 100)
```

`percent = round(score / total * 100, 2)` is for display and sorting only, never for the pass decision.

## BR-02 Passing percent changes everything automatically

`subjects.passing_percent` (1 to 100, default 75) is the only stored value. Pass/fail, topic states, reports and
exports are always computed from the current value. Changing it needs no recalculation job.
The UI shows presets 50 and 75 and a custom value, and warns: "This changes pass/fail and may lock or unlock topics for
all students."

## BR-03 Topic availability (schedule)

A topic is **scheduled** (not yet available) when `now < available_from`. A topic opens at 00:00 in the subject's timezone
on its date and stays open forever after. Time is read on the server only.

## BR-04 Sequencing

Only `published` topics count, ordered by `position`. The first topic needs only its schedule. Every later topic also needs
the **previous published topic to be complete** (BR-05). Past topics are always readable once opened (backtracking).

## BR-05 Completion

A topic is complete when:
- it has a **published quiz** and the student has **at least one graded attempt that passes** (BR-01), or
- it has **no published quiz** and a `topic_progress` row exists for the student.

An attempt in `pending_review` or `in_progress` never counts.

## BR-06 Topic states (what the student sees)

Evaluate in this order for each published topic:

| Order | Condition | `state` | UI |
| --- | --- | --- | --- |
| 1 | `now < available_from` | `scheduled` | Grayed out, not clickable, "Opens {date}" |
| 2 | previous published topic not complete | `locked` | Grayed out with lock, "Pass {previous title} first" |
| 3 | complete | `completed` | Check mark, readable |
| 4 | has a `pending_review` attempt | `pending_review` | "Waiting for your instructor to grade" |
| 5 | has at least one graded attempt (none passing) | `failed` | "Repeat this topic", retake allowed |
| 6 | otherwise | `open` | Available |

`scheduled` wins over `locked` when both are true. Server responses include `reason` (a short code plus the blocking topic id).
Every endpoint that reads topic content or starts, submits or uploads a quiz re-checks the state; only `open`, `failed`,
`pending_review` (read-only) and `completed` topics are accessible.

### Example scenarios (use as unit tests)

| # | Setup (passing 75) | Expected states, topics 1 to 3 |
| --- | --- | --- |
| 1 | All dates in the future | scheduled, scheduled, scheduled |
| 2 | T1 and T2 dates past, no attempts | open, locked, scheduled-or-locked per date |
| 3 | T1 attempt 7/10 (70%) | T1 failed, T2 locked |
| 4 | T1 attempt 8/10 | T1 completed, T2 open |
| 5 | T1 fails 7/10 then passes 8/10 | T1 completed |
| 6 | T1 8/10, passing raised to 90 | T1 failed, T2 locked |
| 7 | T1 7/10, passing lowered to 50 | T1 completed, T2 open |
| 8 | T1 uploaded-quiz attempt pending | T1 pending_review, T2 locked |
| 9 | T1 has no published quiz, not viewed | T1 open, T2 locked |
| 10 | T2 is draft | T1 then T3 sequence ignores T2 |
| 11 | `now` is 23:59 vs 00:00 Manila on T2's date | scheduled, then open |
| 12 | T1 quiz unpublished after the student passed | T1 complete only if viewed (BR-05), otherwise open |

## BR-07 Retakes

Unlimited unless `quizzes.max_attempts` is set. Only one open attempt (`in_progress` or `pending_review`) per student per quiz.
Passing a topic does not forbid further attempts, but a later lower score never changes the best score.

## BR-08 Built-in quiz rules

- 0 to 20 questions while `draft`. **10 to 20 to publish.** A 21st question is always rejected.
- Choice questions: 2 to 6 options, exactly one correct. Text questions: 1 or more accepted answers.
- `points` default 1; `total` = sum of points of current questions; `score` = sum of points of correct answers.
- Unanswered questions score 0. Submitting twice is rejected.
- The student payload never contains `correctOptionId` or `acceptedAnswers`.

## BR-09 Text answer matching

`normalize(s) = s.normalize('NFKC').trim().replace(/\s+/g, ' ').toLowerCase()`. A text answer is correct when
`normalize(answer)` equals `normalize(x)` for any accepted answer `x`. No fuzzy matching in v1.

## BR-10 Regrade

Editing questions never rewrites old scores. `Regrade` recomputes `score` and `total` for every `auto` attempt from its
stored raw answers and the current questions. Answers for deleted questions are ignored. Manual attempts are untouched.

## BR-11 Uploaded quiz (manual grading)

- Faculty set `totalItems` (≥ 1) and may attach the quiz file and/or an external link as instructions.
- Student uploads one image; an attempt is created as `pending_review` with `source = 'manual'`.
- A student may delete their own pending submission and upload a new one. Graded attempts are history.
- Faculty enter `score` with `0 ≤ score ≤ totalItems` (up to 2 decimals). Saving sets `status = graded`, `total = totalItems`,
  `graded_by`, `graded_at`. Faculty may correct a grade later.
- Pass/fail then follows BR-01 exactly like built-in quizzes.

## BR-12 Subjects and enrollment

- Subject `code` is stored upper-case; unique per faculty, term and school year.
- School year format `YYYY-YYYY` and the second year equals the first plus one.
- Join code: 8 characters from `ABCDEFGHJKMNPQRSTUVWXYZ23456789` (no 0/O/1/I/L), generated with `crypto.randomInt`, unique;
  retry on a unique violation. Regenerating invalidates the old code immediately.
- Enrolling needs an active subject with `enrollment_open = true`. Re-joining after removal reactivates the enrollment.
- Archiving a subject hides it from students' lists and blocks new enrollment; data is kept.

## BR-13 Scheduling generator (bulk topics)

Input: `count` (1 to 40), `startDate`, `meetingDays` (weekday numbers). Starting on `startDate`, take the next `count` dates
whose weekday is in `meetingDays`, in order (the start date counts if it matches). Each topic gets `available_from` =
that date at 00:00 in the subject's timezone, title `"{prefix} {n}"` where `n` continues after the subject's highest
position, status `draft`. Faculty adjust any date afterwards. Test with Manila (UTC+8, no DST), month and year boundaries.

## BR-14 Reports

For each enrolled (active) student and each **published quiz whose topic has opened** (`now ≥ available_from`):
- `best` = the graded attempt with the highest percent (ties: latest). No graded attempt → `missing`.
- `passed` per quiz via BR-01. `missing` counts as 0% in the average and as not passed.
- `average` = mean of best percents (missing as 0), rounded to 2 places. `passedCount` / `quizCount` shown.
- `remark` = `Passed` if `average ≥ passingPercent` else `Failed`; `No quizzes yet` if `quizCount = 0`.
- Sorting: `surname` = last name then first name, locale-aware and case/accent-insensitive (`Ñ` sorts with `N`);
  `score` = by `average`; ties broken by surname; students with no quizzes last. `dir` reverses the primary key only.

## BR-15 Deletion and ownership

- Subjects are archived, not deleted. Topics with attempts cannot be deleted (unpublish instead). Questions can be deleted
  unless that leaves a published built quiz below 10.
- Faculty can read and write only subjects where `faculty_id = their id`; admins can read all subjects.
- Students can read only their own attempts and only subjects with an active enrollment.
