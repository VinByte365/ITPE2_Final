// server/services/attempts.service.js
import { AppError } from '../lib/errors.js';
import * as attemptsRepoModule from '../repositories/quizzes.repository.js';
import * as quizzesRepoModule from '../repositories/quizzes.repository.js';
import * as topicsRepoModule from '../repositories/topics.repository.js';
import * as subjectsRepoModule from '../repositories/subjects.repository.js';

export const deps = {
  attemptsRepo: attemptsRepoModule,
  quizzesRepo: quizzesRepoModule,
  topicsRepo: topicsRepoModule,
  subjectsRepo: subjectsRepoModule,
};

export function setDeps(overrides) {
  if (overrides.attemptsRepo) deps.attemptsRepo = overrides.attemptsRepo;
  if (overrides.quizzesRepo) deps.quizzesRepo = overrides.quizzesRepo;
  if (overrides.topicsRepo) deps.topicsRepo = overrides.topicsRepo;
  if (overrides.subjectsRepo) deps.subjectsRepo = overrides.subjectsRepo;
}

function stripKeys(question) {
  if (!question) return question;
  const q = { ...question };
  delete q.correctOptionId;
  delete q.acceptedAnswers;
  return q;
}

export async function startAttempt(studentId, quizId) {
  const quiz = await deps.quizzesRepo.findQuizById(quizId);
  if (!quiz) throw new AppError(404, 'NOT_FOUND', 'Quiz not found.');
  if (quiz.status !== 'published') {
    throw new AppError(403, 'QUIZ_NOT_PUBLISHED', 'This quiz is not published.');
  }

  const topic = await deps.topicsRepo.findTopicById(quiz.topicId);
  if (!topic) throw new AppError(404, 'NOT_FOUND', 'Topic not found.');
  if (topic.status !== 'published') throw new AppError(404, 'NOT_FOUND', 'Topic not found.');

  const subject = await deps.subjectsRepo.findSubjectById(topic.subjectId);
  if (!subject) throw new AppError(404, 'NOT_FOUND', 'Subject not found.');

  const enrollment = await deps.subjectsRepo.findEnrollment(subject.id, studentId);
  if (!enrollment || enrollment.status !== 'active') {
    throw new AppError(403, 'NOT_ENROLLED', 'You are not enrolled in this subject.');
  }

  const availableFrom = new Date(topic.availableFrom);
  if (new Date() < availableFrom) {
    throw new AppError(403, 'TOPIC_NOT_AVAILABLE', 'This topic is not available yet.');
  }

  // max attempts
  const count = await deps.attemptsRepo.countAttempts(quizId, studentId);
  if (quiz.maxAttempts && count >= quiz.maxAttempts) {
    throw new AppError(409, 'MAX_ATTEMPTS_REACHED', 'Maximum attempts reached.');
  }

  // resume in_progress
  const inProgress = await deps.attemptsRepo.findInProgressAttempt(quizId, studentId);
  if (inProgress) {
    const questions = await deps.quizzesRepo.listQuestionsByQuiz(quizId);
    return { attempt: inProgress, questions: questions.map(stripKeys) };
  }

  // new attempt
  const attemptNo = count + 1;
  const attempt = await deps.attemptsRepo.createAttempt({
    quizId,
    studentId,
    attemptNo,
    source: 'auto',
    status: 'in_progress',
    answers: null,
  });
  const questions = await deps.quizzesRepo.listQuestionsByQuiz(quizId);
  return { attempt, questions: questions.map(stripKeys) };
}