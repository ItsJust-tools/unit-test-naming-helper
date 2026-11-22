export type Convention = 'should' | 'when' | 'given' | 'bdd' | 'arr';

export type Framework = 'jest' | 'vitest';

export interface HistoryEntry {
  /** The behavior description the user entered. */
  text: string;
  /** ISO timestamp when the entry was saved. */
  createdAt: string;
}

export interface ToolState {
  /** Description of the behavior under test. */
  behavior: string;
  /** Active naming convention shown in the preview card. */
  convention: Convention;
  /** Raw multi-line batch input (one behavior per line). */
  batchText: string;
  /** Target test framework for exported snippets. */
  framework: Framework;
  /** Saved generation history, newest first. */
  history: HistoryEntry[];
}

export const DEFAULT_STATE: ToolState = {
  behavior: 'loads the user profile when the page mounts',
  convention: 'should',
  batchText: '',
  framework: 'jest',
  history: [],
};

export const MAX_HISTORY = 20;
export const MAX_BEHAVIOR_LENGTH = 120;

export const CONVENTIONS: { value: Convention; label: string; hint: string }[] = [
  { value: 'should', label: 'should', hint: 'should + behavior (classic unit style)' },
  { value: 'when', label: 'when/then', hint: 'when <condition>, then <result>' },
  { value: 'given', label: 'given', hint: 'given <context>, <behavior>' },
  { value: 'bdd', label: 'BDD', hint: 'describe / it with when/then' },
  { value: 'arr', label: 'ARR', hint: 'Arrange-Act-Assert annotated name' },
];

export const VALID_CONVENTIONS: Convention[] = ['should', 'when', 'given', 'bdd', 'arr'];
export const VALID_FRAMEWORKS: Framework[] = ['jest', 'vitest'];
