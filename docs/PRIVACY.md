# Data privacy and backups

## Personal data stored

- Account: email, name, student number, role, approval status.
- Academic: subject enrollments, topic progress, quiz attempts and scores,
  uploaded score images, faculty grades and feedback.

## Who can see it

- Students see only their own profile, enrollments, progress, attempts and grades.
- Faculty see students enrolled in their own subjects, their progress and scores.
- Admins manage users and roles.

## Export / delete on request

- A student's data can be exported by querying their profile, enrollments,
  attempts and progress rows (admin/faculty scope) and provided as CSV/PDF.
- Deletion: remove the auth user (Supabase Auth) and cascade-delete profile,
  enrollments, attempts and progress. Uploaded images should be removed from
  Storage via the cleanup script.

## Backups

- Supabase provides automated daily backups for the Postgres database and
  Storage. Restore from the Supabase dashboard (Database → Backups).
- Keep `.env` (credentials) out of version control; never commit secrets.
