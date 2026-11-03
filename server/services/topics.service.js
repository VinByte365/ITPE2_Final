// server/services/topics.service.js
import { AppError } from "../lib/errors.js";
import { generateSchedule } from "../utils/schedule.js";
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

function requireSubjectOwnerCheck(subject, facultyId, isAdmin) {
  if (!subject) throw new AppError(404, "NOT_FOUND", "Subject not found.");
  if (!isAdmin && subject.facultyId !== facultyId) {
    throw new AppError(404, "NOT_FOUND", "Subject not found.");
  }
}

export async function listTopics(facultyId, subjectId, isAdmin) {
  const subject = await deps.subjectsRepo.findSubjectById(subjectId);
  requireSubjectOwnerCheck(subject, facultyId, isAdmin);
  return deps.topicsRepo.listTopicsBySubject(subjectId);
}

export async function createTopic(facultyId, subjectId, data, isAdmin) {
  const subject = await deps.subjectsRepo.findSubjectById(subjectId);
  requireSubjectOwnerCheck(subject, facultyId, isAdmin);

  const maxPos = await deps.topicsRepo.getMaxPosition(subjectId);
  const topic = await deps.topicsRepo.createTopic({
    subjectId,
    position: maxPos + 1,
    title: data.title,
    description: data.description,
    availableFrom: `${data.availableFrom}T00:00:00.000Z`,
    status: data.status,
  });
  return topic;
}

export async function updateTopic(facultyId, topicId, data, isAdmin) {
  const topic = await deps.topicsRepo.findTopicById(topicId);
  if (!topic) throw new AppError(404, "NOT_FOUND", "Topic not found.");

  const subject = await deps.subjectsRepo.findSubjectById(topic.subjectId);
  requireSubjectOwnerCheck(subject, facultyId, isAdmin);

  const updates = { ...data };
  if (updates.availableFrom) {
    updates.availableFrom = `${updates.availableFrom}T00:00:00.000Z`;
  }
  return deps.topicsRepo.updateTopic(topicId, updates);
}

export async function deleteTopic(facultyId, topicId, isAdmin) {
  const topic = await deps.topicsRepo.findTopicById(topicId);
  if (!topic) throw new AppError(404, "NOT_FOUND", "Topic not found.");

  const subject = await deps.subjectsRepo.findSubjectById(topic.subjectId);
  requireSubjectOwnerCheck(subject, facultyId, isAdmin);

  const has = await deps.topicsRepo.hasAttempts(topicId);
  if (has) {
    throw new AppError(409, "TOPIC_HAS_ATTEMPTS", "Cannot delete a topic that has student attempts.");
  }

  await deps.topicsRepo.deleteTopic(topicId);
  return { deleted: true };
}

export async function bulkCreateTopics(facultyId, subjectId, data, isAdmin) {
  const subject = await deps.subjectsRepo.findSubjectById(subjectId);
  requireSubjectOwnerCheck(subject, facultyId, isAdmin);

  const maxPos = await deps.topicsRepo.getMaxPosition(subjectId);
  const timezone = subject.timezone || "Asia/Manila";

  const dates = generateSchedule(data.count, data.startDate, data.meetingDays, timezone);

  const topics = dates.map((date, i) => ({
    subjectId,
    position: maxPos + i + 1,
    title: `${data.titlePrefix || "Topic"} ${maxPos + i + 1}`,
    description: null,
    availableFrom: `${date}T00:00:00.000Z`,
    status: "draft",
  }));

  return deps.topicsRepo.createTopicsBulk(topics);
}

export async function reorderTopics(facultyId, subjectId, topicIds, isAdmin) {
  const subject = await deps.subjectsRepo.findSubjectById(subjectId);
  requireSubjectOwnerCheck(subject, facultyId, isAdmin);

  const topics = await deps.topicsRepo.listTopicsBySubject(subjectId);
  const existingIds = new Set(topics.map((t) => t.id));
  if (topicIds.length !== existingIds.size) {
    throw new AppError(422, "VALIDATION_ERROR", "Topic list must include exactly all subject topics.");
  }
  for (const id of topicIds) {
    if (!existingIds.has(id)) {
      throw new AppError(422, "VALIDATION_ERROR", "Topic list must include exactly all subject topics.");
    }
  }

  await deps.topicsRepo.reorderTopics(subjectId, topicIds);
  return deps.topicsRepo.listTopicsBySubject(subjectId);
}