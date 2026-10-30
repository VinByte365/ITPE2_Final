import { env } from '../config/env.js';
import { AppError } from '../lib/errors.js';
import { getAuthClient } from '../lib/supabase.js';
import { ensureProfile } from '../repositories/profiles.repository.js';

const mapSignInError = (error) => {
  const message = error?.message || '';

  if (/email not confirmed/i.test(message)) {
    return new AppError(
      403,
      'EMAIL_NOT_CONFIRMED',
      'Confirm your email address before signing in.',
    );
  }

  if (/rate limit|too many/i.test(message)) {
    return new AppError(
      429,
      'AUTH_RATE_LIMITED',
      'Too many sign-in attempts. Wait a moment and try again.',
    );
  }

  if (/invalid login credentials|invalid credentials/i.test(message)) {
    return new AppError(
      401,
      'INVALID_CREDENTIALS',
      'That email and password combination is not correct.',
    );
  }

  return new AppError(
    401,
    'AUTH_FAILED',
    'Unable to sign in. Check your credentials and try again.',
  );
};

export async function signIn(email, password) {
  const client = getAuthClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw mapSignInError(error);
  if (!data.session || !data.user) {
    throw new AppError(
      403,
      'SESSION_NOT_CREATED',
      'Sign-in succeeded but no session was created. Check your Supabase Auth settings.',
    );
  }

  const profile = await ensureProfile(data.user);

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      emailConfirmedAt: data.user.email_confirmed_at,
    },
    profile,
    session: data.session,
  };
}

export async function refreshSession(refreshToken) {
  if (!refreshToken) {
    throw new AppError(
      401,
      'SESSION_EXPIRED',
      'Your session has expired. Sign in again.',
    );
  }

  const client = getAuthClient();
  const { data, error } = await client.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data.session || !data.user) {
    throw new AppError(
      401,
      'SESSION_EXPIRED',
      'Your session has expired. Sign in again.',
    );
  }

  const profile = await ensureProfile(data.user);

  return {
    user: {
      id: data.user.id,
      email: data.user.email,
      emailConfirmedAt: data.user.email_confirmed_at,
    },
    profile,
    session: data.session,
  };
}

export async function requestPasswordReset(email) {
  const client = getAuthClient();
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo: env.passwordResetRedirectUrl,
  });

  // Do not expose whether an account exists for this email address.
  if (error && !/rate limit|too many/i.test(error.message || '')) {
    console.warn('[auth] Password reset request failed:', error.message);
  }

  return { accepted: true };
}

export function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    emailConfirmedAt: user.email_confirmed_at || null,
  };
}
