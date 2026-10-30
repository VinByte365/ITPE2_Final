import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth.js';
import adminRoutes from './admin.routes.js';
import authRoutes from './auth.routes.js';
import publicRoutes from './public.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/', publicRoutes);
router.use(
  '/admin',
  requireAuth,
  requireRole('admin', 'editor'),
  adminRoutes,
);

export default router;
