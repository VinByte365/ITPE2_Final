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
export async function listQuestions(facultyId, quizId, isAdmin) {
  const quiz = await deps.quizzesRepo.findQuizById(quizId);
  if (!quiz) throw new AppError(404, "NOT_FOUND", "Quiz not found.");
  await checkTopicOwner(quiz.topicId, facultyId, isAdmin);
  return deps.quizzesRepo.listQuestionsByQuiz(quizId);
}

function genOptionId() {
  return Math.random().toString(36).slice(2, 10);
}

export async function createQuestion(facultyId, quizId, data, isAdmin) {
  const quiz = await deps.quizzesRepo.findQuizById(quizId);
  if (!quiz) throw new AppError(404, "NOT_FOUND", "Quiz not found.");
  await checkTopicOwner(quiz.topicId, facultyId, isAdmin);

  const count = await deps.quizzesRepo.countQuestions(quizId);
  if (count >= 20) {
    throw new AppError(422, "QUIZ_QUESTION_COUNT", "A quiz can have at most 20 questions.");
  }

  let options = null;
  let correctOptionId = null;
  if (data.type === "choice") {
    options = (data.options || []).map((o) => ({ id: genOptionId(), label: o.label }));
    if (typeof data.correctOptionIndex === "number" && options[data.correctOptionIndex]) {
      correctOptionId = options[data.correctOptionIndex].id;
    }
  }

  const position = count + 1;
  const created = await deps.quizzesRepo.createQuestion({
    quizId,
    position,
    type: data.type,
    prompt: data.prompt,
    options,
    correctOptionId,
    acceptedAnswers: data.acceptedAnswers || null,
    points: data.points,
  });
  return created;
}

export async function updateQuestion(facultyId, questionId, data, isAdmin) {
  const question = await deps.quizzesRepo.findQuestionById(questionId);
  if (!question) throw new AppError(404, "NOT_FOUND", "Question not found.");
  const quiz = await deps.quizzesRepo.findQuizById(question.quizId);
  if (!quiz) throw new AppError(404, "NOT_FOUND", "Quiz not found.");
  await checkTopicOwner(quiz.topicId, facultyId, isAdmin);

  const updates = { ...data };
  if (data.type === "choice" && Array.isArray(data.options)) {
    const newOptions = data.options.map((o) => {
      const existing = (question.options || []).find((x) => x.label === o.label);
      return { id: existing ? existing.id : genOptionId(), label: o.label };
    });
    updates.options = newOptions;
    if (typeof data.correctOptionIndex === "number" && newOptions[data.correctOptionIndex]) {
      updates.correctOptionId = newOptions[data.correctOptionIndex].id;
    }
  }
  delete updates.correctOptionIndex;

  const updated = await deps.quizzesRepo.updateQuestion(questionId, updates);
  return updated;
}

export async function deleteQuestion(facultyId, questionId, isAdmin) {
  const question = await deps.quizzesRepo.findQuestionById(questionId);
  if (!question) throw new AppError(404, "NOT_FOUND", "Question not found.");
  const quiz = await deps.quizzesRepo.findQuizById(question.quizId);
  if (!quiz) throw new AppError(404, "NOT_FOUND", "Quiz not found.");
  await checkTopicOwner(quiz.topicId, facultyId, isAdmin);

  // published built quiz cannot drop below 10
  if (quiz.status === "published" && quiz.mode === "built") {
    const count = await deps.quizzesRepo.countQuestions(quiz.id);
    if (count <= 10) {
      throw new AppError(422, "QUIZ_QUESTION_COUNT", "Cannot delete: published quiz must keep at least 10 questions.");
    }
  }

  await deps.quizzesRepo.deleteQuestion(questionId);
  return { deleted: true };
}

export async function reorderQuestions(facultyId, quizId, questionIds, isAdmin) {
  const quiz = await deps.quizzesRepo.findQuizById(quizId);
  if (!quiz) throw new AppError(404, "NOT_FOUND", "Quiz not found.");
  await checkTopicOwner(quiz.topicId, facultyId, isAdmin);
  await deps.quizzesRepo.reorderQuestions(quizId, questionIds);
  return deps.quizzesRepo.listQuestionsByQuiz(quizId);
}
