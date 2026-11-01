// server/routes/faculty.routes.js
import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../lib/errors.js';
import { requireAuth, requireApproved, requireRole, requireSubjectOwner } from '../middleware/auth.js';
import {
  archiveSubject,
  createSubject,
  getSubject,
  getRoster,
  listFacultySubjects,
  listAllFacultySubjects,
  regenerateJoinCode,
  removeStudent,
  toggleEnrollment,
  updateSubject,
} from '../services/subjects.service.js';
import {
  createSubjectSchema,
  updateSubjectSchema,
} from '../validators/subject.validator.js';
import { uuidSchema } from '../validators/common.js';

const router = Router();

// All faculty routes require auth + approved + faculty role
router.use(requireAuth, requireApproved, requireRole('admin', 'faculty'));

// GET /faculty/subjects?status=active
router.get(
  '/subjects',
  asyncHandler(async (req, res) => {
    const status = req.query.status;
    const isAdmin = req.auth.profile?.role === 'admin';
    const subjects = isAdmin
      ? await listAllFacultySubjects(status)
      : await listFacultySubjects(req.auth.profile.id, status);

    const { countStudents } = await import('../repositories/subjects.repository.js');
    const withCounts = await Promise.all(
      subjects.map(async (s) => ({
        ...s,
        studentCount: await countStudents(s.id),
      })),
    );
    res.json({ data: withCounts });
  }),
);

// POST /faculty/subjects
router.post(
  '/subjects',
  asyncHandler(async (req, res) => {
    const input = createSubjectSchema.parse(req.body);
    const subject = await createSubject(req.auth.profile.id, input);
    res.status(201).json({ data: subject });
  }),
);

// GET /faculty/subjects/:id
router.get(
  '/subjects/:id',
  requireSubjectOwner('id'),
  asyncHandler(async (req, res) => {
    const isAdmin = req.auth.profile?.role === 'admin';
    const subject = await getSubject(req.auth.profile.id, req.params.id, isAdmin);
    res.json({ data: subject });
  }),
);

// PATCH /faculty/subjects/:id
router.patch(
  '/subjects/:id',
  requireSubjectOwner('id'),
  asyncHandler(async (req, res) => {
    const input = updateSubjectSchema.parse(req.body);
    const isAdmin = req.auth.profile?.role === 'admin';
    const subject = await updateSubject(req.auth.profile.id, req.params.id, input, isAdmin);
    res.json({ data: subject });
  }),
);

// POST /faculty/subjects/:id/join-code (regenerate)
router.post(
  '/subjects/:id/join-code',
  requireSubjectOwner('id'),
  asyncHandler(async (req, res) => {
    const isAdmin = req.auth.profile?.role === 'admin';
    const subject = await regenerateJoinCode(req.auth.profile.id, req.params.id, isAdmin);
    res.json({ data: subject });
  }),
);

// GET /faculty/subjects/:id/students (roster)
router.get(
  '/subjects/:id/students',
  requireSubjectOwner('id'),
  asyncHandler(async (req, res) => {
    const roster = await getRoster(req.params.id);
    res.json({ data: roster });
  }),
);

// DELETE /faculty/subjects/:id/students/:studentId (remove student)
router.delete(
  '/subjects/:id/students/:studentId',
  requireSubjectOwner('id'),
  asyncHandler(async (req, res) => {
    const studentId = uuidSchema.parse(req.params.studentId);
    const isAdmin = req.auth.profile?.role === 'admin';
    const enrollment = await removeStudent(req.auth.profile.id, req.params.id, studentId, isAdmin);
    res.json({ data: enrollment });
  }),
);

// PATCH /faculty/subjects/:id/archive
router.patch(
  '/subjects/:id/archive',
  requireSubjectOwner('id'),
  asyncHandler(async (req, res) => {
    const isAdmin = req.auth.profile?.role === 'admin';
    const subject = await archiveSubject(req.auth.profile.id, req.params.id, isAdmin);
    res.json({ data: subject });
  }),
);

// PATCH /faculty/subjects/:id/enrollment (toggle open/close)
router.patch(
  '/subjects/:id/enrollment',
  requireSubjectOwner('id'),
  asyncHandler(async (req, res) => {
    const { open } = z.object({ open: z.boolean() }).parse(req.body);
    const isAdmin = req.auth.profile?.role === 'admin';
    const subject = await toggleEnrollment(req.auth.profile.id, req.params.id, open, isAdmin);
    res.json({ data: subject });
  }),
);

export default router;