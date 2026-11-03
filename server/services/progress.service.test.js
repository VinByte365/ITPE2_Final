// server/services/progress.service.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeTopicStates, isTopicAccessible } from './progress.service.js';

function topic(id, position, availableFrom, title = `Topic ${position}`) {
  return { id, position, title, availableFrom, subjectId: 'subj1', status: 'published' };
}

function quiz(id, topicId) {
  return { id, topicId, status: 'published' };
}

function attempt(quizId, { status = 'graded', score = null, total = null } = {}) {
  return { id: `att-${Math.random()}`, quizId, status, score, total, studentId: 's1' };
}

const PAST = '2020-01-01T00:00:00Z';
const FUTURE = '2099-01-01T00:00:00Z';
const NOW = new Date('2026-11-01T12:00:00Z');

describe('computeTopicStates', () => {
  // Scenario 1: All dates in the future → scheduled, scheduled, scheduled
  it('scenario 1: all future → all scheduled', () => {
    const topics = [topic('t1', 1, FUTURE), topic('t2', 2, FUTURE), topic('t3', 3, FUTURE)];
    const states = computeTopicStates({
      topics, quizByTopicId: {}, attempts: [], progressTopicIds: new Set(), passingPercent: 75, now: NOW,
    });
    assert.deepStrictEqual(states.map((s) => s.state), ['scheduled', 'scheduled', 'scheduled']);
  });

  // Scenario 2: T1,T2 past, no attempts → open, locked, scheduled-or-locked
  it('scenario 2: T1,T2 past no attempts → open, locked, scheduled/locked', () => {
    const topics = [topic('t1', 1, PAST), topic('t2', 2, PAST), topic('t3', 3, FUTURE)];
    const quizByTopicId = { t1: quiz('q1', 't1'), t2: quiz('q2', 't2'), t3: quiz('q3', 't3') };
    const states = computeTopicStates({
      topics, quizByTopicId, attempts: [], progressTopicIds: new Set(), passingPercent: 75, now: NOW,
    });
    assert.strictEqual(states[0].state, 'open');
    assert.strictEqual(states[1].state, 'locked');
    // T3: scheduled wins over locked (BR-06 order 1 before order 2)
    assert.strictEqual(states[2].state, 'scheduled');
  });

  // Scenario 3: T1 attempt 7/10 (70%) → T1 failed, T2 locked
  it('scenario 3: T1 7/10 at 75% → failed, locked', () => {
    const topics = [topic('t1', 1, PAST), topic('t2', 2, PAST)];
    const quizByTopicId = { t1: quiz('q1', 't1'), t2: quiz('q2', 't2') };
    const attempts = [attempt('q1', { score: 7, total: 10 })];
    const states = computeTopicStates({
      topics, quizByTopicId, attempts, progressTopicIds: new Set(), passingPercent: 75, now: NOW,
    });
    assert.strictEqual(states[0].state, 'failed');
    assert.strictEqual(states[1].state, 'locked');
  });

  // Scenario 4: T1 attempt 8/10 → T1 completed, T2 open
  it('scenario 4: T1 8/10 → completed, open', () => {
    const topics = [topic('t1', 1, PAST), topic('t2', 2, PAST)];
    const quizByTopicId = { t1: quiz('q1', 't1'), t2: quiz('q2', 't2') };
    const attempts = [attempt('q1', { score: 8, total: 10 })];
    const states = computeTopicStates({
      topics, quizByTopicId, attempts, progressTopicIds: new Set(), passingPercent: 75, now: NOW,
    });
    assert.strictEqual(states[0].state, 'completed');
    assert.strictEqual(states[1].state, 'open');
  });

  // Scenario 5: T1 fails 7/10 then passes 8/10 → T1 completed
  it('scenario 5: T1 fail then pass → completed', () => {
    const topics = [topic('t1', 1, PAST)];
    const quizByTopicId = { t1: quiz('q1', 't1') };
    const attempts = [
      attempt('q1', { score: 7, total: 10 }),
      attempt('q1', { score: 8, total: 10 }),
    ];
    const states = computeTopicStates({
      topics, quizByTopicId, attempts, progressTopicIds: new Set(), passingPercent: 75, now: NOW,
    });
    assert.strictEqual(states[0].state, 'completed');
  });

  // Scenario 6: T1 8/10, passing raised to 90 → T1 failed, T2 locked
  it('scenario 6: pass raised to 90 → failed, locked', () => {
    const topics = [topic('t1', 1, PAST), topic('t2', 2, PAST)];
    const quizByTopicId = { t1: quiz('q1', 't1'), t2: quiz('q2', 't2') };
    const attempts = [attempt('q1', { score: 8, total: 10 })];
    const states = computeTopicStates({
      topics, quizByTopicId, attempts, progressTopicIds: new Set(), passingPercent: 90, now: NOW,
    });
    assert.strictEqual(states[0].state, 'failed');
    assert.strictEqual(states[1].state, 'locked');
  });

  // Scenario 7: T1 7/10, passing lowered to 50 → T1 completed, T2 open
  it('scenario 7: pass lowered to 50 → completed, open', () => {
    const topics = [topic('t1', 1, PAST), topic('t2', 2, PAST)];
    const quizByTopicId = { t1: quiz('q1', 't1'), t2: quiz('q2', 't2') };
    const attempts = [attempt('q1', { score: 7, total: 10 })];
    const states = computeTopicStates({
      topics, quizByTopicId, attempts, progressTopicIds: new Set(), passingPercent: 50, now: NOW,
    });
    assert.strictEqual(states[0].state, 'completed');
    assert.strictEqual(states[1].state, 'open');
  });

  // Scenario 8: T1 uploaded-quiz attempt pending → T1 pending_review, T2 locked
  it('scenario 8: pending review → pending_review, locked', () => {
    const topics = [topic('t1', 1, PAST), topic('t2', 2, PAST)];
    const quizByTopicId = { t1: quiz('q1', 't1'), t2: quiz('q2', 't2') };
    const attempts = [attempt('q1', { status: 'pending_review', score: null, total: null })];
    const states = computeTopicStates({
      topics, quizByTopicId, attempts, progressTopicIds: new Set(), passingPercent: 75, now: NOW,
    });
    assert.strictEqual(states[0].state, 'pending_review');
    assert.strictEqual(states[1].state, 'locked');
  });

  // Scenario 9: T1 has no published quiz, not viewed → T1 open, T2 locked
  it('scenario 9: no quiz, not viewed → open, locked', () => {
    const topics = [topic('t1', 1, PAST), topic('t2', 2, PAST)];
    const quizByTopicId = { t2: quiz('q2', 't2') };
    const states = computeTopicStates({
      topics, quizByTopicId, attempts: [], progressTopicIds: new Set(), passingPercent: 75, now: NOW,
    });
    assert.strictEqual(states[0].state, 'open');
    assert.strictEqual(states[1].state, 'locked');
  });

  // Scenario 9b: no quiz but viewed → completed, next open
  it('scenario 9b: no quiz, viewed → completed, open', () => {
    const topics = [topic('t1', 1, PAST), topic('t2', 2, PAST)];
    const quizByTopicId = { t2: quiz('q2', 't2') };
    const states = computeTopicStates({
      topics, quizByTopicId, attempts: [], progressTopicIds: new Set(['t1']), passingPercent: 75, now: NOW,
    });
    assert.strictEqual(states[0].state, 'completed');
    assert.strictEqual(states[1].state, 'open');
  });

  // Scenario 10: T2 is draft → T1 then T3, T2 skipped (only published topics passed in)
  it('scenario 10: draft topic excluded → sequence skips it', () => {
    // Only published topics are in the array; T2 draft is omitted by the caller
    const topics = [topic('t1', 1, PAST), topic('t3', 3, PAST)];
    const quizByTopicId = { t1: quiz('q1', 't1'), t3: quiz('q3', 't3') };
    const attempts = [attempt('q1', { score: 8, total: 10 })];
    const states = computeTopicStates({
      topics, quizByTopicId, attempts, progressTopicIds: new Set(), passingPercent: 75, now: NOW,
    });
    assert.strictEqual(states[0].state, 'completed');
    assert.strictEqual(states[1].state, 'open'); // T3 follows T1 directly
  });

  // Scenario 11: 23:59 vs 00:00 Manila on T2's date
  it('scenario 11: timezone boundary', () => {
    // T2 opens 2026-11-02 at 00:00 Manila (UTC+8) = 2026-11-01T16:00:00Z
    const t2Date = '2026-11-02T00:00:00+08:00';
    const topics = [topic('t1', 1, PAST), topic('t2', 2, t2Date)];
    const quizByTopicId = { t1: quiz('q1', 't1') };

    // at 23:59 Manila on Nov 1 = 15:59 UTC on Nov 1 → T2 scheduled
    const nowBefore = new Date('2026-11-01T15:59:00Z');
    const states1 = computeTopicStates({
      topics, quizByTopicId, attempts: [attempt('q1', { score: 10, total: 10 })],
      progressTopicIds: new Set(), passingPercent: 75, now: nowBefore,
    });
    assert.strictEqual(states1[1].state, 'scheduled');

    // at 00:00 Manila on Nov 2 = 16:00 UTC on Nov 1 → T2 open
    const nowAfter = new Date('2026-11-01T16:00:00Z');
    const states2 = computeTopicStates({
      topics, quizByTopicId, attempts: [attempt('q1', { score: 10, total: 10 })],
      progressTopicIds: new Set(), passingPercent: 75, now: nowAfter,
    });
    assert.strictEqual(states2[1].state, 'open');
  });

  // Scenario 12: T1 quiz unpublished after student passed → no quiz in quizByTopicId
  // Complete only if topic_progress exists (BR-05)
  it('scenario 12: quiz unpublished after pass → complete if viewed', () => {
    const topics = [topic('t1', 1, PAST)];
    // No published quiz → uses topic_progress
    const states1 = computeTopicStates({
      topics, quizByTopicId: {}, attempts: [], progressTopicIds: new Set(['t1']),
      passingPercent: 75, now: NOW,
    });
    assert.strictEqual(states1[0].state, 'completed');

    // Not viewed → open
    const states2 = computeTopicStates({
      topics, quizByTopicId: {}, attempts: [], progressTopicIds: new Set(),
      passingPercent: 75, now: NOW,
    });
    assert.strictEqual(states2[0].state, 'open');
  });
});

describe('isTopicAccessible', () => {
  it('allows open, failed, pending_review, completed', () => {
    assert.strictEqual(isTopicAccessible('open'), true);
    assert.strictEqual(isTopicAccessible('failed'), true);
    assert.strictEqual(isTopicAccessible('pending_review'), true);
    assert.strictEqual(isTopicAccessible('completed'), true);
  });

  it('rejects scheduled and locked', () => {
    assert.strictEqual(isTopicAccessible('scheduled'), false);
    assert.strictEqual(isTopicAccessible('locked'), false);
  });
});

