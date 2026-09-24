import { describe, expect, it } from 'vitest';
import { normalizeLearnerState } from '../../tutor/learner-state.js';

describe('normalizeLearnerState', () => {
  it('rejects malformed or incomplete records', () => {
    expect(normalizeLearnerState(null)).toBeNull();
    expect(normalizeLearnerState({ name: 'A learner' })).toBeNull();
    expect(normalizeLearnerState({ name: 'A learner', skill: 'Latin' })).toBeNull();
  });

  it('normalizes valid persisted state with safe defaults', () => {
    expect(normalizeLearnerState({
      name: '  Mina  ',
      skill: 'Grammar',
      score: 2.8,
      difficulty: 99,
      mcpOnline: 'true'
    })).toMatchObject({
      name: 'Mina',
      level: 'B1',
      index: 0,
      score: 0,
      difficulty: 1,
      mcpOnline: false
    });
  });

  it('clamps integer progress fields to supported bounds', () => {
    expect(normalizeLearnerState({
      name: 'Mina',
      skill: 'Reading',
      index: -2,
      score: 12,
      difficulty: 7,
      mcpOnline: true
    })).toMatchObject({ index: 0, score: 12, difficulty: 3, mcpOnline: true });
  });
});
