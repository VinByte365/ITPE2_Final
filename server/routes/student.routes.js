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
import { uuidSchema } from '../validators/common.js';
import { startAttempt, submitAttempt } from '../services/attempts.service.js';

import { listStudentContent } from '../services/content.service.js';
import {
  completeTopic,
  getStudentTopic,
  listStudentTopics,
} from '../services/student-topics.service.js';

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

// GET /student/subjects/:id/topics
router.get(
  '/subjects/:id/topics',
  requireEnrolled('id'),
  asyncHandler(async (req, res) => {
    const topics = await listStudentTopics(req.auth.profile.id, req.params.id);
    res.json({ data: topics });
  }),
);

// GET /student/topics/:id
router.get(
  '/topics/:id',
  asyncHandler(async (req, res) => {
    const topicId = uuidSchema.parse(req.params.id);
    const topic = await getStudentTopic(req.auth.profile.id, topicId);
    res.json({ data: topic });
  }),
);

// GET /student/topics/:id/content
router.get(
  '/topics/:id/content',
  asyncHandler(async (req, res) => {
    const topicId = uuidSchema.parse(req.params.id);
    const blocks = await listStudentContent(req.auth.profile.id, topicId);
    res.json({ data: blocks });
  }),
);
router.post(
  '/topics/:id/complete',
  asyncHandler(async (req, res) => {
    const topicId = uuidSchema.parse(req.params.id);
    const result = await completeTopic(req.auth.profile.id, topicId);
    res.json({ data: result });
  }),
);

// POST /student/quizzes/:id/attempts
router.post(
  '/quizzes/:id/attempts',
  asyncHandler(async (req, res) => {
    const quizId = uuidSchema.parse(req.params.id);
    const result = await startAttempt(req.auth.profile.id, quizId);
    res.json({ data: result });
  }),
);


// POST /student/attempts/:id/submit
router.post(
  '/attempts/:id/submit',
  asyncHandler(async (req, res) => {
    const attemptId = uuidSchema.parse(req.params.id);
    const answers = req.body?.answers ?? req.body ?? [];
    const result = await submitAttempt(req.auth.profile.id, attemptId, answers);
    res.json({ data: result });
  }),
);


export default router;