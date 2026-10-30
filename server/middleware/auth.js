import { env } from '../config/env.js';
import { getAccessToken } from '../lib/cookies.js';
import { AppError, asyncHandler, forbidden, unauthorized } from '../lib/errors.js';
import { verifyAccessToken } from '../lib/supabase.js';
import { ensureProfile } from '../repositories/profiles.repository.js';

export const requireAuth = asyncHandler(async (req, res, next) => {
  const token = getAccessToken(req);

  if (!token) throw unauthorized();

  const { data, error } = await verifyAccessToken(token);

  if (error || !data?.user) {
    throw new AppError(
      401,
      'INVALID_TOKEN',
      'Your session is invalid or has expired. Sign in again.',
    );
  }

  const profile = await ensureProfile(data.user);

  req.auth = {
    token,
    user: data.user,
    profile,
  };

  next();
});

export const requireRole = (...roles) => (req, res, next) => {
  const role = req.auth?.profile?.role;

  if (!req.auth) {
    return next(unauthorized());
  }

  if (!role || !roles.includes(role)) {
    return next(
      forbidden('This action requires a higher access level.'),
    );
  }

  return next();
};

export const requireAdmin = requireRole('admin');

export function currentUserPayload(req) {
  return {
    user: {
      id: req.auth.user.id,
      email: req.auth.user.email,
      emailConfirmedAt: req.auth.user.email_confirmed_at || null,
    },
    profile: req.auth.profile,
    tokenExpiresAt: req.auth.user.exp || null,
  };
}

export const authConfig = {
  cookieName: env.cookies.accessName,
};
