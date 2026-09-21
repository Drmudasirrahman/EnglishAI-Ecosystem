export type Skill = 'Grammar' | 'Vocabulary' | 'Reading' | 'Writing' | 'Speaking' | 'Listening';

export interface SkillSignal {
  skill: Skill;
  attempts: number;
  correct: number;
  recentCorrect?: number;
  recentAttempts?: number;
}

export interface NextStep {
  skill: Skill;
  difficulty: 1 | 2 | 3;
  mode: 'support' | 'practice' | 'challenge';
  rationale: string;
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function accuracy(signal: SkillSignal): number {
  if (signal.attempts <= 0) return 0;
  return clamp(signal.correct / signal.attempts, 0, 1);
}

function recentAccuracy(signal: SkillSignal): number {
  const attempts = signal.recentAttempts ?? signal.attempts;
  const correct = signal.recentCorrect ?? signal.correct;
  if (attempts <= 0) return 0;
  return clamp(correct / attempts, 0, 1);
}

export function recommendNextStep(signals: SkillSignal[], preferredSkill?: Skill): NextStep {
  if (signals.length === 0) {
    const skill = preferredSkill ?? 'Grammar';
    return {
      skill,
      difficulty: 1,
      mode: 'support',
      rationale: 'No performance evidence is available yet; begin with supported practice.'
    };
  }

  const ranked = [...signals].sort((a, b) => {
    const aNeed = 1 - (0.65 * recentAccuracy(a) + 0.35 * accuracy(a));
    const bNeed = 1 - (0.65 * recentAccuracy(b) + 0.35 * accuracy(b));
    return bNeed - aNeed;
  });

  const chosen = ranked.find((signal) => signal.skill === preferredSkill) ?? ranked[0];
  const overall = 0.65 * recentAccuracy(chosen) + 0.35 * accuracy(chosen);

  if (overall < 0.5) {
    return {
      skill: chosen.skill,
      difficulty: 1,
      mode: 'support',
      rationale: `${chosen.skill} needs reinforcement before difficulty increases.`
    };
  }

  if (overall < 0.8) {
    return {
      skill: chosen.skill,
      difficulty: 2,
      mode: 'practice',
      rationale: `${chosen.skill} is developing; continue varied practice with feedback.`
    };
  }

  return {
    skill: chosen.skill,
    difficulty: 3,
    mode: 'challenge',
    rationale: `${chosen.skill} is strong enough for a more demanding task.`
  };
}
