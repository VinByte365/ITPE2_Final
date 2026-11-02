// server/repositories/quizzes.repository.js
import { dbQuery } from '../db/pool.js';
import { mapQuiz } from '../utils/mappers.js';

export async function findQuizById(id) {
  const { rows } = await dbQuery(
    `select id, topic_id, title, mode, instructions, total_items, external_url,
            attachment_path, attachment_name, attachment_mime, max_attempts,
            show_answers, status, created_at, updated_at
       from public.quizzes where id = $1 limit 1`,
    [id],
  );
  return mapQuiz(rows[0]);
}

export async function findQuizByTopic(topicId) {
  const { rows } = await dbQuery(
    `select id, topic_id, title, mode, instructions, total_items, external_url,
            attachment_path, attachment_name, attachment_mime, max_attempts,
            show_answers, status, created_at, updated_at
       from public.quizzes where topic_id = $1 limit 1`,
    [topicId],
  );
  return mapQuiz(rows[0]);
}

export async function createQuiz(data) {
  const { rows } = await dbQuery(
    `insert into public.quizzes
       (topic_id, title, mode, instructions, total_items, external_url,
        attachment_path, attachment_name, attachment_mime, max_attempts,
        show_answers, status)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     returning id, topic_id, title, mode, instructions, total_items, external_url,
               attachment_path, attachment_name, attachment_mime, max_attempts,
               show_answers, status, created_at, updated_at`,
    [
      data.topicId,
      data.title,
      data.mode,
      data.instructions ?? null,
      data.totalItems ?? null,
      data.externalUrl ?? null,
      data.attachmentPath ?? null,
      data.attachmentName ?? null,
      data.attachmentMime ?? null,
      data.maxAttempts ?? null,
      data.showAnswers ?? false,
      data.status ?? 'draft',
    ],
  );
  return mapQuiz(rows[0]);
}

export async function updateQuiz(id, data) {
  const sets = [];
  const params = [id];
  let i = 2;
  const fieldMap = {
    title: 'title',
    mode: 'mode',
    instructions: 'instructions',
    totalItems: 'total_items',
    externalUrl: 'external_url',
    attachmentPath: 'attachment_path',
    attachmentName: 'attachment_name',
    attachmentMime: 'attachment_mime',
    maxAttempts: 'max_attempts',
    showAnswers: 'show_answers',
    status: 'status',
  };
  for (const [key, column] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      sets.push(`${column} = $${i++}`);
      params.push(data[key]);
    }
  }
  if (sets.length === 0) return findQuizById(id);
  sets.push('updated_at = now()');
  const { rows } = await dbQuery(
    `update public.quizzes set ${sets.join(', ')} where id = $1
     returning id, topic_id, title, mode, instructions, total_items, external_url,
               attachment_path, attachment_name, attachment_mime, max_attempts,
               show_answers, status, created_at, updated_at`,
    params,
  );
  return mapQuiz(rows[0]);
}

export async function hasAttempts(quizId) {
  const { rows } = await dbQuery(
    `select 1 from public.attempts where quiz_id = $1 limit 1`,
    [quizId],
  );
  return rows.length > 0;
}

export async function deleteQuiz(id) {
  const { rows } = await dbQuery(`delete from public.quizzes where id = $1 returning id`, [id]);
  return rows[0] ? rows[0].id : null;
}