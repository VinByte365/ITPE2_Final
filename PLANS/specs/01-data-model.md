# Spec 01 · Data Model

SQL here is a **sketch**: names and types are binding, exact syntax must be adapted after HK-01
(`VER-01` to `VER-04`). Rules in `03-business-rules.md` explain the meaning of each field.

## Conventions

- Migrations live in `server/db/migrations/NNN_name.sql`, are applied in filename order by
  `npm run db:migrate` (HK-04), and are recorded in a `schema_migrations` table. Each runs in a transaction.
- Every statement must be re-runnable (`if not exists`, `create or replace`, `drop ... if exists`).
- New tables: `id uuid primary key default gen_random_uuid()`, `created_at`/`updated_at timestamptz not null default now()`,
  reuse the existing `updated_at` trigger function (VER-02).
- Enable RLS on every new table and add **no policies** (DEC-25). The API connects through the pool.
- Legacy tables (`themes`, `modules`, `presenters`, `module_videos`, `module_presenters`) are not modified.

## Migration order

| File | Contents | Task |
| --- | --- | --- |
| `001_lms_profiles.sql` | profile columns, role rename, signup trigger update, RLS helper update | AUTH-01 to AUTH-03 |
| `002_subjects_enrollments.sql` | `subjects`, `enrollments` | SUBJ-01 |
| `003_topics_content.sql` | `topics`, `topic_content`, `topic_progress` | TOPIC-01 |
| `004_quizzes_attempts.sql` | `quizzes`, `questions`, `attempts` | QUIZ-01 |
| `005_*.sql` | only if later phases need changes (e.g. `topic_overrides` for the stretch task) | as needed |

## 001 · profiles (existing table, extended)

```sql
alter table profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists student_number text,
  add column if not exists approval_status text not null default 'approved'
    check (approval_status in ('pending','approved','rejected'));

-- ORDER MATTERS: drop the old role check first, then update rows, then add the new check.
alter table profiles drop constraint if exists <role_check_name>;     -- VER-01
update profiles set role = 'student' where role = 'viewer';
update profiles set role = 'faculty' where role = 'editor';
alter table profiles add constraint profiles_role_check check (role in ('admin','faculty','student'));
alter table profiles alter column role set default 'student';

create unique index if not exists profiles_student_number_key
  on profiles (lower(student_number)) where student_number is not null;
```

- Keep the existing `full_name`; the service sets `full_name = first_name || ' ' || last_name`.
- **Signup trigger** (`handle_new_user` or its real name, VER-03): copy `first_name`, `last_name`, `student_number`
  from `raw_user_meta_data`, always insert role `student` and `approval_status = 'approved'`.
  It must **never read a role from metadata**, because anyone can call Supabase sign-up directly with any metadata.
  The API's `register()` upgrades a faculty applicant afterwards (role `faculty`, `approval_status = 'pending'`).
- Legacy RLS helper functions and policies that mention `editor` must be rewritten to `admin`/`faculty` (AUTH-03).

## 002 · subjects, enrollments

```sql
create table if not exists subjects (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references profiles(id),
  code text not null,                                   -- "IT101", stored upper-case
  name text not null,
  description text,
  term text not null check (term in ('1st Semester','2nd Semester','Summer')),
  school_year text not null check (school_year ~ '^\d{4}-\d{4}$'),
  join_code text not null unique,                       -- 8 chars, see BR-12
  enrollment_open boolean not null default true,
  passing_percent smallint not null default 75 check (passing_percent between 1 and 100),
  timezone text not null default 'Asia/Manila',
  status text not null default 'active' check (status in ('active','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (faculty_id, code, term, school_year)
);

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  student_id uuid not null references profiles(id),
  status text not null default 'active' check (status in ('active','removed')),
  enrolled_at timestamptz not null default now(),
  unique (subject_id, student_id)
);
create index if not exists enrollments_student_idx on enrollments (student_id);
```

## 003 · topics, content, progress

```sql
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references subjects(id) on delete cascade,
  position integer not null check (position > 0),
  title text not null,
  description text,
  available_from timestamptz not null,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, position) deferrable initially deferred     -- allows reordering in one transaction
);

create table if not exists topic_content (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references topics(id) on delete cascade,
  type text not null check (type in ('text','summary','notes','presentation','video')),
  title text,
  body text,                                   -- markdown for text/summary/notes
  url text,                                    -- Google Slides / video link
  file_path text, file_name text, file_mime text, file_size integer,
  visible_to_students boolean not null default true,
  position integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (type <> 'presentation' or url is not null or file_path is not null),
  check (type not in ('text','summary','notes') or body is not null)
);

create table if not exists topic_progress (        -- only used for topics without a published quiz
  student_id uuid not null references profiles(id),
  topic_id uuid not null references topics(id) on delete cascade,
  first_viewed_at timestamptz not null default now(),
  primary key (student_id, topic_id)
);
```

## 004 · quizzes, questions, attempts

```sql
create table if not exists quizzes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null unique references topics(id) on delete cascade,   -- one quiz per topic
  title text not null,
  mode text not null check (mode in ('built','uploaded')),
  instructions text,
  total_items integer check (total_items between 1 and 1000),              -- uploaded mode only
  external_url text,                                                       -- uploaded mode: e.g. a Google Form
  attachment_path text, attachment_name text, attachment_mime text,        -- uploaded mode: the quiz file
  max_attempts smallint check (max_attempts is null or max_attempts > 0),
  show_answers boolean not null default false,
  status text not null default 'draft' check (status in ('draft','published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (mode <> 'uploaded' or total_items is not null)
);

create table if not exists questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  position integer not null,
  type text not null check (type in ('choice','text')),
  prompt text not null,
  options jsonb,                  -- choice: [{"id":"a1b2","label":"..."}], 2 to 6 items
  correct_option_id text,         -- choice
  accepted_answers text[],        -- text: at least one
  points numeric(5,2) not null default 1 check (points > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quiz_id, position) deferrable initially deferred
);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references quizzes(id) on delete cascade,
  student_id uuid not null references profiles(id),
  attempt_no integer not null,
  source text not null check (source in ('auto','manual')),
  status text not null check (status in ('in_progress','pending_review','graded')),
  answers jsonb,                  -- auto: [{"questionId","optionId"|"text"}] raw answers, kept for regrading
  score numeric(6,2), total numeric(6,2),   -- null until graded
  image_path text,                -- manual: the uploaded score image
  feedback text,
  graded_by uuid references profiles(id), graded_at timestamptz,
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (quiz_id, student_id, attempt_no),
  check (status <> 'graded' or (score is not null and total is not null and score between 0 and total))
);
create index if not exists attempts_student_quiz_idx on attempts (student_id, quiz_id);
```

Notes: store `score` and `total`, never `passed` or `percent` (percent may be returned by queries as a computed value).
A partial unique index `(quiz_id, student_id) where status in ('in_progress','pending_review')` should prevent two open
attempts at once.

## Derived, never stored

`passed`, `percent`, topic `state`, a student's overall average and remark. See `03-business-rules.md`.

## Storage buckets (created by `server/scripts/setup-storage.js`, HK-09)

| Bucket | Public | Used for | Object path |
| --- | --- | --- | --- |
| `topic-files` | no | presentations and quiz attachments | `subjects/{subjectId}/topics/{topicId}/{uuid}-{safeName}` |
| `quiz-uploads` | no | student score images | `subjects/{subjectId}/quizzes/{quizId}/{studentId}/{uuid}.{ext}` |
