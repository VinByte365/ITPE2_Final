import { dbQuery } from '../db/pool.js';
import { mapProfile } from '../utils/mappers.js';

export async function findProfileById(id) {
  const { rows } = await dbQuery(
    `select id, email, full_name, first_name, last_name, student_number,
            approval_status, role, created_at, updated_at
       from public.profiles
      where id = $1
      limit 1`,
    [id],
  );

  return mapProfile(rows[0]);
}

export async function ensureProfile(user) {
  const existing = await findProfileById(user.id);
  if (existing) return existing;

  const email = user.email || null;
  const fullName = user.user_metadata?.full_name || null;

  const { rows } = await dbQuery(
    `insert into public.profiles (id, email, full_name, first_name, last_name, student_number)
     values ($1, $2, $3, $4, $5, $6)
     on conflict (id) do update
       set email = coalesce(excluded.email, public.profiles.email),
           updated_at = now()
     returning id, email, full_name, first_name, last_name, student_number,
               approval_status, role, created_at, updated_at`,
    [
      user.id,
      email,
      fullName,
      user.user_metadata?.first_name || null,
      user.user_metadata?.last_name || null,
      user.user_metadata?.student_number || null,
    ],
  );

  return mapProfile(rows[0]);
}

export async function listProfiles() {
  const { rows } = await dbQuery(`
    select p.id,
           p.email,
           p.full_name,
           p.first_name,
           p.last_name,
           p.student_number,
           p.approval_status,
           p.role,
           p.created_at,
           p.updated_at,
           u.last_sign_in_at
      from public.profiles p
      left join auth.users u on u.id = p.id
     order by p.created_at asc
  `);

  return rows.map((row) => ({
    ...mapProfile(row),
    lastSignInAt: row.last_sign_in_at,
  }));
}

export async function updateProfileRole(id, role) {
  const { rows } = await dbQuery(
    `update public.profiles
        set role = $2,
            updated_at = now()
      where id = $1
      returning id, email, full_name, first_name, last_name, student_number,
                approval_status, role, created_at, updated_at`,
    [id, role],
  );

  return mapProfile(rows[0]);
}

export async function countAdmins() {
  const { rows } = await dbQuery(
    `select count(*)::int as count
       from public.profiles
      where role = 'admin'`,
  );

  return rows[0]?.count || 0;
}
