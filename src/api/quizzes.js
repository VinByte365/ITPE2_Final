// src/api/quizzes.js
import { del, get, patch, post, put } from './client.js';

// Faculty
export async function getFacultyQuiz(topicId) {
  return get(`/faculty/topics/${topicId}/quiz`);
}

export async function upsertQuizMeta(topicId, payload) {
  return put(`/faculty/topics/${topicId}/quiz`, payload);
}

export async function updateQuizStatus(quizId, status) {
  return patch(`/faculty/quizzes/${quizId}`, { status });
}

export async function listQuestions(quizId) {
  return get(`/faculty/quizzes/${quizId}/questions`);
}

export async function createQuestion(quizId, payload) {
  return post(`/faculty/quizzes/${quizId}/questions`, payload);
}

export async function updateQuestion(id, payload) {
  return patch(`/faculty/questions/${id}`, payload);
}

export async function deleteQuestion(id) {
  return del(`/faculty/questions/${id}`);
}

export async function reorderQuestions(quizId, questionIds) {
  return put(`/faculty/quizzes/${quizId}/questions/order`, { questionIds });
}

export async function importQuestions(quizId, questions) {
  return post(`/faculty/quizzes/${quizId}/questions/import`, { questions });
}

export async function regradeQuiz(quizId) {
  return post(`/faculty/quizzes/${quizId}/regrade`);
}

// Student
export async function startAttempt(quizId) {
  return post(`/student/quizzes/${quizId}/attempts`);
}

export async function submitAttempt(attemptId, answers) {
  return post(`/student/attempts/${attemptId}/submit`, { answers });
}

export async function getAttemptHistory(quizId) {
  return get(`/student/quizzes/${quizId}/attempts`);
}