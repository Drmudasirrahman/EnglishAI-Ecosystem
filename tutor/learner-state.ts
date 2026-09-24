export const learnerSkills = ['Grammar', 'Vocabulary', 'Reading', 'Writing', 'Speaking', 'Listening'] as const;
export type LearnerSkill = (typeof learnerSkills)[number];

export interface LearnerState {
  name: string;
  language: string;
  level: string;
  skill: LearnerSkill;
  goal: string;
  createdAt: string;
  index: number;
  score: number;
  difficulty: number;
  mcpOnline: boolean;
}

const text = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value.trim() : fallback;

const boundedInt = (value: unknown, fallback: number, min: number, max: number): number => {
  if (!Number.isInteger(value)) return fallback;
  return Math.min(max, Math.max(min, value as number));
};

const isSkill = (value: unknown): value is LearnerSkill =>
  typeof value === 'string' && (learnerSkills as readonly string[]).includes(value);

/**
 * Normalize untrusted localStorage/API data before it reaches the learner model.
 * Invalid or incomplete records are rejected rather than silently becoming a new learner.
 */
export function normalizeLearnerState(input: unknown): LearnerState | null {
  if (!input || typeof input !== 'object') return null;
  const record = input as Record<string, unknown>;
  const name = text(record.name);
  const skill = record.skill;
  if (!name || !isSkill(skill)) return null;

  return {
    name,
    language: text(record.language),
    level: text(record.level, 'B1'),
    skill,
    goal: text(record.goal),
    createdAt: text(record.createdAt, new Date(0).toISOString()),
    index: boundedInt(record.index, 0, 0, 100000),
    score: boundedInt(record.score, 0, 0, 100000),
    difficulty: boundedInt(record.difficulty, 1, 1, 3),
    mcpOnline: record.mcpOnline === true
  };
}
