// server/routes/student.routes.js
import { Router } from 'express';
import { asyncHandler } from '../lib/errors.js';
import { requireAuth, requireRole, requireEnrolled } from '../middleware/auth.js';
import {
  enrollStudent,
  listStudentSubjects,
} from '../services/subjects.service.js';
import { enrollLimiter } from '../middleware/rateLimit.js';
import { enrollSchema } from '../validators/subject.validator.js';

const router = Router();

// All student routes require auth + student role
router.use(requireAuth, requireRole('admin', 'student'));

// POST /student/enrollments
router.post(
  '/enrollments',
  enrollLimiter,
  asyncHandler(async (req, res) => {
    const { joinCode } = enrollSchema.parse(req.body);
    const result = await enrollStudent(req.auth.profile.id, joinCode);
    res.status(201).json({ data: result });
  }),
);

// GET /student/subjects
router.get(
  '/subjects',
  asyncHandler(async (req, res) => {
    const subjects = await listStudentSubjects(req.auth.profile.id);
    res.json({ data: subjects });
  }),
);

// GET /student/subjects/:id
router.get(
  '/subjects/:id',
  requireEnrolled('id'),
  asyncHandler(async (req, res) => {
    // Subject is already loaded by requireEnrolled middleware
    const subject = req.subject;
    // Include passing percent etc. (already in subject)
    res.json({ data: subject });
  }),
);

export default router;