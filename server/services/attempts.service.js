// server/services/attempts.service.js
import { gradeAttempt, isPassed, computePercent, gradeQuestion } from './grading.js';

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

export async function submitAttempt(studentId, attemptId, answersPayload) {
  const attempt = await deps.attemptsRepo.findAttemptById(attemptId);
  if (!attempt) throw new AppError(404, "NOT_FOUND", "Attempt not found.");
  if (attempt.studentId !== studentId) throw new AppError(404, "NOT_FOUND", "Attempt not found.");
  if (attempt.status !== "in_progress") {
    throw new AppError(409, "ATTEMPT_ALREADY_SUBMITTED", "This attempt has already been submitted.");
  }

  const quiz = await deps.quizzesRepo.findQuizById(attempt.quizId);
  if (!quiz) throw new AppError(404, "NOT_FOUND", "Quiz not found.");

  const topic = await deps.topicsRepo.findTopicById(quiz.topicId);
  const subject = await deps.subjectsRepo.findSubjectById(topic.subjectId);
  const passingPercent = subject.passingPercent;

  const questions = await deps.quizzesRepo.listQuestionsByQuiz(quiz.id);

  // Build answers map for grading
  const answers = Array.isArray(answersPayload) ? answersPayload : (answersPayload?.answers || []);
  const answerMap = {};
  for (const a of answers) {
    if (a && a.questionId) {
      answerMap[a.questionId] = a.optionId !== undefined ? a.optionId : a.text;
    }
  }
  // Also support array aligned? We use map.

  // gradeAttempt expects answers array aligned OR object. Pass object map.
  const { score, total } = gradeAttempt(questions, answerMap);
  const passed = isPassed(score, total, passingPercent);
  const percent = computePercent(score, total);

  await deps.attemptsRepo.updateAttempt(attemptId, {
    status: "graded",
    answers,
    score,
    total,
    submittedAt: new Date().toISOString(),
  });

  const response = { score, total, percent, passed, passingPercent };
  if (quiz.showAnswers) {
    response.review = questions.map((q) => {
      const ans = answerMap[q.id];
      return { questionId: q.id, correct: gradeQuestion(q, ans) > 0 };
    });
  }
  return response;
}
