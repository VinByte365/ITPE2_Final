// server/services/quizzes.service.js
import { AppError } from '../lib/errors.js';
import * as quizzesRepoModule from '../repositories/quizzes.repository.js';
import * as topicsRepoModule from '../repositories/topics.repository.js';
import * as subjectsRepoModule from '../repositories/subjects.repository.js';

export const deps = {
  quizzesRepo: quizzesRepoModule,
  topicsRepo: topicsRepoModule,
  subjectsRepo: subjectsRepoModule,
};

export function setDeps(overrides) {
  if (overrides.quizzesRepo) deps.quizzesRepo = overrides.quizzesRepo;
  if (overrides.topicsRepo) deps.topicsRepo = overrides.topicsRepo;
  if (overrides.subjectsRepo) deps.subjectsRepo = overrides.subjectsRepo;
}

async function checkTopicOwner(topicId, facultyId, isAdmin) {
  const topic = await deps.topicsRepo.findTopicById(topicId);
  if (!topic) throw new AppError(404, 'NOT_FOUND', 'Topic not found.');
  const subject = await deps.subjectsRepo.findSubjectById(topic.subjectId);
  if (!subject) throw new AppError(404, 'NOT_FOUND', 'Subject not found.');
  if (!isAdmin && subject.facultyId !== facultyId) {
    throw new AppError(404, 'NOT_FOUND', 'Topic not found.');
  }
  return { topic, subject };
}

export async function getQuiz(facultyId, topicId, isAdmin) {
  await checkTopicOwner(topicId, facultyId, isAdmin);
  return deps.quizzesRepo.findQuizByTopic(topicId);
}

export async function upsertQuizMeta(facultyId, topicId, data, isAdmin) {
  await checkTopicOwner(topicId, facultyId, isAdmin);

  const existing = await deps.quizzesRepo.findQuizByTopic(topicId);

  if (existing) {
    // mode locked once attempts exist
    if (data.mode !== undefined && data.mode !== existing.mode) {
      const has = await deps.quizzesRepo.hasAttempts(existing.id);
      if (has) {
        throw new AppError(409, 'QUIZ_HAS_ATTEMPTS', 'Quiz mode cannot change once attempts exist.');
      }
    }
    const updated = await deps.quizzesRepo.updateQuiz(existing.id, data);
    return updated;
  }

  // create
  const mode = data.mode || 'built';
  const title = data.title || 'Quiz';
  const created = await deps.quizzesRepo.createQuiz({
    topicId,
    title,
    mode,
    instructions: data.instructions,
    totalItems: data.totalItems,
    externalUrl: data.externalUrl,
    attachmentPath: data.attachmentPath,
    attachmentName: data.attachmentName,
    attachmentMime: data.attachmentMime,
    maxAttempts: data.maxAttempts,
    showAnswers: data.showAnswers,
    status: data.status,
  });
  return created;
}