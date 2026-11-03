# Spec 06 · Security and Storage

## Authorization matrix

| Resource | Student | Faculty | Admin |
| --- | --- | --- | --- |
| Own profile | read/update names | read/update | read/update |
| Other profiles | no | students in own subjects (names, number) | all, roles, approvals |
| Subject | read if enrolled | create; read/write own | read all |
| Topics, content | read published if state allows | write own | read all |
| Quiz with answer keys | never | own | read all |
| Attempts | own only | for own subjects (read, grade) | read all |
| Reports | own grades only | own subjects | read all |

## Middleware to build (AUTH-05, SUBJ-04)

| Name | Behaviour |
| --- | --- |
| `requireAuth` | Existing. Populates `req.auth` (`req.auth.user`, `req.auth.profile`, `req.auth.token`). |
| `requireRole(...roles)` | `403 ROLE_FORBIDDEN` if the profile role is not listed. |
| `requireApproved` | `403 APPROVAL_PENDING` if `approval_status <> 'approved'`. Applied to all faculty routes. |
| `requireSubjectOwner(param)` | Loads the subject; faculty must be `faculty_id`; admin passes. Attaches `req.subject`. Returns `404` (not `403`) for subjects that do not exist. |
| `requireEnrolled(param)` | Student must have an `active` enrollment in the subject. |
| `originGuard` | For `POST/PUT/PATCH/DELETE`: if an `Origin` header is present it must be in `CORS_ORIGIN`, otherwise `403 ORIGIN_NOT_ALLOWED`; require `Content-Type: application/json` for requests with bodies (JSON posts need a CORS preflight, which blocks cross-site forms). |

Resources reached by child ids (`/faculty/topics/:id`, `/faculty/questions/:id`, `/faculty/attempts/:id`, ...) must be traced
up to their subject and checked with the same ownership rule. Put that lookup in the repository (one query), not in routes.

## Rules

- Every endpoint is behind `requireAuth` except those marked public. New routers mount under role-specific prefixes.
- Never trust ids from the body for ownership: derive subject, quiz and student from the path and the session.
- Never return `correctOptionId`, `acceptedAnswers` or other students' data to a student.
- Rate limits (use `middleware/rateLimit.js`): register 5/hour/IP · login existing · enroll 10/10 min/user · upload-url 30/10 min/user · submissions 20/hour/user.
- Join-code failures return the same message whether the code is invalid or the subject is archived.
- Generic messages for failed login and password reset (existing behaviour) are kept.
- Log request id, user id, route and status. Never log passwords, tokens, signed URLs or answer content.
- Student data (names, numbers, scores) is personal data: no public endpoints, no analytics scripts on LMS pages,
  exports are generated only for the owning faculty member.

## Cookies and hosting

- Preferred: frontend and API on sibling subdomains of one registrable domain with `COOKIE_SAME_SITE=lax`, `COOKIE_SECURE=true`.
- Cross-site hosting (`SameSite=None`) is allowed only with `originGuard` active and an exact `CORS_ORIGIN`.
- Keep `TRUST_PROXY=true` behind a proxy so rate limits see real client IPs.

## Uploads

Flow (both buckets):

1. Client asks the API for an upload URL, sending `fileName`, `mime`, `size`. The API validates **before** issuing a URL:
   extension and MIME on the allow-list, size within the limit, permissions (faculty owns the topic; student is enrolled and the topic is accessible).
2. API calls Supabase Storage `createSignedUploadUrl(path)` with the service role and returns `{ uploadUrl, token, path }`. Paths are built
   by the server (`buildObjectPath`) from ids and a random uuid; the client's file name is sanitized and used only for display.
3. Client uploads the file directly to the signed URL.
4. Client calls the create endpoint (content block or submission) with the `path`. The API verifies the path starts with the expected prefix,
   the object exists, size and MIME are within limits, and for images checks the magic bytes (JPEG `FF D8 FF`, PNG `89 50 4E 47`, WebP `RIFF....WEBP`).
   On any failure it deletes the object and returns `422 UPLOAD_INVALID`.

| Kind | Types | Max size |
| --- | --- | --- |
| Presentation / quiz attachment | `.pdf`, `.pptx`, plus `.txt` and images for quiz attachments | 25 MB (env `MAX_FILE_MB`) |
| Student score image | `.jpg`, `.jpeg`, `.png`, `.webp` | 5 MB (env `MAX_IMAGE_MB`) |

Downloads: the API returns signed URLs valid for `SIGNED_URL_TTL_SECONDS` (default 120) only after an access check. Buckets are private.
Deleting a content block, attempt or quiz attachment deletes its storage object. `UPL-08` cleans up orphans left by abandoned uploads.

## Supabase specifics

- Enable RLS on all new tables with no policies (DEC-25); never expose the service role key to the frontend or to logs.
- The `public` schema is reachable through Supabase's REST API with the anon key. RLS-without-policies is what stops that.
- Verify after each migration: with the anon key, `select` on each new table returns nothing (QA-04).
