import { describe, expect, it } from 'vitest';
import { recommendNextStep } from '../../tutor/adaptive/next-step.js';

describe('recommendNextStep', () => {
  it('starts with supported practice when no evidence exists', () => {
    expect(recommendNextStep([], 'Vocabulary')).toEqual({
      skill: 'Vocabulary',
      difficulty: 1,
      mode: 'support',
      rationale: 'No performance evidence is available yet; begin with supported practice.'
    });
  });

  it('prioritizes recent weakness over older aggregate performance', () => {
    const next = recommendNextStep([
      { skill: 'Grammar', attempts: 20, correct: 17, recentAttempts: 5, recentCorrect: 1 },
      { skill: 'Reading', attempts: 10, correct: 5, recentAttempts: 5, recentCorrect: 3 }
    ]);

    expect(next.skill).toBe('Grammar');
    expect(next.mode).toBe('support');
    expect(next.difficulty).toBe(1);
  });

  it('keeps a developing skill at practice difficulty', () => {
    const next = recommendNextStep([
      { skill: 'Writing', attempts: 10, correct: 7, recentAttempts: 5, recentCorrect: 4 }
    ]);

    expect(next).toMatchObject({ skill: 'Writing', difficulty: 2, mode: 'practice' });
  });

  it('raises strong performance to challenge difficulty', () => {
    const next = recommendNextStep([
      { skill: 'Listening', attempts: 10, correct: 9, recentAttempts: 5, recentCorrect: 5 }
    ]);

    expect(next).toMatchObject({ skill: 'Listening', difficulty: 3, mode: 'challenge' });
  });

  it('honors a preferred skill when it is present', () => {
    const next = recommendNextStep([
      { skill: 'Grammar', attempts: 10, correct: 2 },
      { skill: 'Speaking', attempts: 10, correct: 8 }
    ], 'Speaking');

    expect(next.skill).toBe('Speaking');
  });
});
