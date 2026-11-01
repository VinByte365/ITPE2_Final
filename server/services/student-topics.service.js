// server/services/student-topics.service.js
import { AppError } from "../lib/errors.js";
import * as topicsRepoModule from "../repositories/topics.repository.js";
import * as subjectsRepoModule from "../repositories/subjects.repository.js";

export const deps = {
  topicsRepo: topicsRepoModule,
  subjectsRepo: subjectsRepoModule,
};

export function setDeps(overrides) {
  if (overrides.topicsRepo) deps.topicsRepo = overrides.topicsRepo;
  if (overrides.subjectsRepo) deps.subjectsRepo = overrides.subjectsRepo;
}

export async function listStudentTopics(studentId, subjectId) {
  const subject = await deps.subjectsRepo.findSubjectById(subjectId);
  if (!subject) throw new AppError(404, "NOT_FOUND", "Subject not found.");

  const enrollment = await deps.subjectsRepo.findEnrollment(subjectId, studentId);
  if (!enrollment || enrollment.status !== "active") {
    throw new AppError(403, "NOT_ENROLLED", "You are not enrolled in this subject.");
  }

  const topics = await deps.topicsRepo.listTopicsBySubject(subjectId);
  const published = topics.filter((t) => t.status === "published");

  const now = new Date();
  return published.map((topic) => {
    const availableFrom = new Date(topic.availableFrom);
    let state = "open";
    if (now < availableFrom) state = "scheduled";
    return { ...topic, state, availableFrom: topic.availableFrom };
  });
}

export async function getStudentTopic(studentId, topicId) {
  const topic = await deps.topicsRepo.findTopicById(topicId);
  if (!topic) throw new AppError(404, "NOT_FOUND", "Topic not found.");
  if (topic.status !== "published") {
    throw new AppError(404, "NOT_FOUND", "Topic not found.");
  }

  const subject = await deps.subjectsRepo.findSubjectById(topic.subjectId);
  if (!subject) throw new AppError(404, "NOT_FOUND", "Subject not found.");

  const enrollment = await deps.subjectsRepo.findEnrollment(subject.id, studentId);
  if (!enrollment || enrollment.status !== "active") {
    throw new AppError(403, "NOT_ENROLLED", "You are not enrolled in this subject.");
  }

  const availableFrom = new Date(topic.availableFrom);
  const now = new Date();
  if (now < availableFrom) {
    throw new AppError(403, "TOPIC_NOT_AVAILABLE", "This topic is not available yet.");
  }

  return topic;
}

export async function completeTopic(studentId, topicId) {
  const topic = await deps.topicsRepo.findTopicById(topicId);
  if (!topic) throw new AppError(404, "NOT_FOUND", "Topic not found.");
  if (topic.status !== "published") {
    throw new AppError(404, "NOT_FOUND", "Topic not found.");
  }

  const subject = await deps.subjectsRepo.findSubjectById(topic.subjectId);
  if (!subject) throw new AppError(404, "NOT_FOUND", "Subject not found.");

  const enrollment = await deps.subjectsRepo.findEnrollment(subject.id, studentId);
  if (!enrollment || enrollment.status !== "active") {
    throw new AppError(403, "NOT_ENROLLED", "You are not enrolled in this subject.");
  }

  const availableFrom = new Date(topic.availableFrom);
  const now = new Date();
  if (now < availableFrom) {
    throw new AppError(403, "TOPIC_NOT_AVAILABLE", "This topic is not available yet.");
  }

  await deps.topicsRepo.recordTopicProgress(studentId, topicId);
  return { completed: true };
}