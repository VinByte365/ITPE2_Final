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
  bulkCreateTopics,
  createTopic,
  deleteTopic,
  listTopics,
  reorderTopics,
  updateTopic,
} from '../services/topics.service.js';
import {
  createContentBlock,
  deleteContentBlock,
  getUploadUrl,
  listContent,
  reorderContentBlocks,
  updateContentBlock,
} from '../services/content.service.js';
import {
  contentBlockSchema,
  updateContentBlockSchema,
} from '../validators/content.validator.js';
import {
  createTopicSchema,
  updateTopicSchema,
  bulkTopicsSchema,
  reorderTopicsSchema,
} from '../validators/topic.validator.js';
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

// GET /faculty/subjects/:id/topics
router.get(
  '/subjects/:id/topics',
  requireSubjectOwner('id'),
  asyncHandler(async (req, res) => {
    const isAdmin = req.auth.profile?.role === 'admin';
    const topics = await listTopics(req.auth.profile.id, req.params.id, isAdmin);
    res.json({ data: topics });
  }),
);

// POST /faculty/subjects/:id/topics
router.post(
  '/subjects/:id/topics',
  requireSubjectOwner('id'),
  asyncHandler(async (req, res) => {
    const input = createTopicSchema.parse(req.body);
    const isAdmin = req.auth.profile?.role === 'admin';
    const topic = await createTopic(req.auth.profile.id, req.params.id, input, isAdmin);
    res.status(201).json({ data: topic });
  }),
);

// POST /faculty/subjects/:id/topics/bulk
router.post(
  '/subjects/:id/topics/bulk',
  requireSubjectOwner('id'),
  asyncHandler(async (req, res) => {
    const input = bulkTopicsSchema.parse(req.body);
    const isAdmin = req.auth.profile?.role === 'admin';
    const topics = await bulkCreateTopics(req.auth.profile.id, req.params.id, input, isAdmin);
    res.status(201).json({ data: topics });
  }),
);

// PUT /faculty/subjects/:id/topics/order
router.put(
  '/subjects/:id/topics/order',
  requireSubjectOwner('id'),
  asyncHandler(async (req, res) => {
    const { topicIds } = reorderTopicsSchema.parse(req.body);
    const isAdmin = req.auth.profile?.role === 'admin';
    const topics = await reorderTopics(req.auth.profile.id, req.params.id, topicIds, isAdmin);
    res.json({ data: topics });
  }),
);

// PATCH /faculty/topics/:id
router.patch(
  '/topics/:id',
  asyncHandler(async (req, res) => {
    const topicId = uuidSchema.parse(req.params.id);
    const input = updateTopicSchema.parse(req.body);
    const isAdmin = req.auth.profile?.role === 'admin';
    const updated = await updateTopic(req.auth.profile.id, topicId, input, isAdmin);
    res.json({ data: updated });
  }),
);

// DELETE /faculty/topics/:id
router.delete(
  '/topics/:id',
  asyncHandler(async (req, res) => {
    const topicId = uuidSchema.parse(req.params.id);
    const isAdmin = req.auth.profile?.role === 'admin';
    const result = await deleteTopic(req.auth.profile.id, topicId, isAdmin);
    res.json({ data: result });
  }),
);

// GET /faculty/topics/:id/content
router.get(
  '/topics/:id/content',
  asyncHandler(async (req, res) => {
    const topicId = uuidSchema.parse(req.params.id);
    const isAdmin = req.auth.profile?.role === 'admin';
    const blocks = await listContent(req.auth.profile.id, topicId, isAdmin);
    res.json({ data: blocks });
  }),
);

// POST /faculty/topics/:id/content
router.post(
  '/topics/:id/content',
  asyncHandler(async (req, res) => {
    const topicId = uuidSchema.parse(req.params.id);
    const input = contentBlockSchema.parse(req.body);
    const isAdmin = req.auth.profile?.role === 'admin';
    const block = await createContentBlock(req.auth.profile.id, topicId, input, isAdmin);
    res.status(201).json({ data: block });
  }),
);

// PATCH /faculty/content/:id
router.patch(
  '/content/:id',
  asyncHandler(async (req, res) => {
    const blockId = uuidSchema.parse(req.params.id);
    const input = updateContentBlockSchema.parse(req.body);
    const isAdmin = req.auth.profile?.role === 'admin';
    const block = await updateContentBlock(req.auth.profile.id, blockId, input, isAdmin);
    res.json({ data: block });
  }),
);

// DELETE /faculty/content/:id
router.delete(
  '/content/:id',
  asyncHandler(async (req, res) => {
    const blockId = uuidSchema.parse(req.params.id);
    const isAdmin = req.auth.profile?.role === 'admin';
    const result = await deleteContentBlock(req.auth.profile.id, blockId, isAdmin);
    res.json({ data: result });
  }),
);

// PUT /faculty/topics/:id/content/order
router.put(
  '/topics/:id/content/order',
  asyncHandler(async (req, res) => {
    const topicId = uuidSchema.parse(req.params.id);
    const { blockIds } = z.object({ blockIds: z.array(uuidSchema) }).parse(req.body);
    const isAdmin = req.auth.profile?.role === 'admin';
    const blocks = await reorderContentBlocks(req.auth.profile.id, topicId, blockIds, isAdmin);
    res.json({ data: blocks });
  }),
);

// POST /faculty/topics/:id/content/upload-url
router.post(
  '/topics/:id/content/upload-url',
  asyncHandler(async (req, res) => {
    const topicId = uuidSchema.parse(req.params.id);
    const { fileName, mime, size, kind } = z.object({
      fileName: z.string().min(1),
      mime: z.string().min(1),
      size: z.number().int().positive(),
      kind: z.string().optional().default('presentation'),
    }).parse(req.body);
    const isAdmin = req.auth.profile?.role === 'admin';
    const result = await getUploadUrl(req.auth.profile.id, topicId, kind, { fileName, mime, size }, isAdmin);
    res.json({ data: result });
  }),
);

export default router;