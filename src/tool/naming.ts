export interface NameSuggestions {
  should: string;
  whenThen: string;
  given: string;
  bdd: { describe: string; it: string };
  arr: string;
}

export interface BatchResult {
  behavior: string;
  suggestions: NameSuggestions;
}

export interface Warning {
  type: 'empty' | 'vague' | 'too_long' | 'no_verb';
  message: string;
}

import {
  CONVENTIONS,
  DEFAULT_STATE,
  MAX_BEHAVIOR_LENGTH,
  type Convention,
  type Framework,
  type ToolState,
} from './types';

const SMALL_WORDS = new Set([
  'a',
  'an',
  'and',
  'as',
  'at',
  'but',
  'by',
  'for',
  'in',
  'of',
  'on',
  'or',
  'the',
  'to',
  'with',
]);

function normalize(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function isVague(value: string): boolean {
  const vagueTerms = ['stuff', 'thing', 'things', 'it', 'something', 'works', 'correctly'];
  const words = value
    .toLowerCase()
    .split(/[^a-z0-9']+/)
    .filter(Boolean);
  return words.length > 0 && words.every((w) => vagueTerms.includes(w));
}

/** Normalize a behavior description; collapses whitespace and trims trailing punctuation. */
export function normalizeBehavior(behavior: string): string {
  return normalize(behavior).replace(/[.!?]+$/, '');
}

/** Title-case a phrase, keeping small words lower-case (except the first word). */
export function titleCase(phrase: string): string {
  return phrase
    .split(' ')
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      if (index > 0 && SMALL_WORDS.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

/** Split a camelCase or snake_case word into spaced words. */
export function splitIdentifier(word: string): string {
  return word
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Detect an explicit when-clause: "when <condition>, <behavior>" or
 * "when <condition>, then <behavior>". Returns null when absent.
 */
function splitWhenClause(behavior: string): { condition: string; outcome: string } | null {
  const match = /^(when|if)\s+(.+)$/i.exec(behavior) as RegExpExecArray | null;
  if (!match) return null;
  const rest = (match[2] ?? '').trim();
  const commaSplit: string[] = rest.split(/,\s*/);
  if (commaSplit.length >= 2 && commaSplit[0] !== undefined && commaSplit[1] !== undefined) {
    const outcomePart = commaSplit.slice(1).join(', ');
    const thenTrimmed = /^then\s+/i.test(commaSplit[1].trim())
      ? outcomePart.replace(/^then\s+/i, '')
      : outcomePart;
    return { condition: commaSplit[0].trim(), outcome: thenTrimmed.trim() };
  }
  return null;
}

/** should-style name: "should <behavior>". */
export function shouldName(behavior: string): string {
  const clean = normalizeBehavior(behavior);
  if (!clean) return '';
  const lower = clean.charAt(0).toLowerCase() + clean.slice(1);
  return `should ${lower}`;
}

/** when/then style: "when <condition>, then <outcome>" — falls back gracefully. */
export function whenThenName(behavior: string): string {
  const clean = normalizeBehavior(behavior);
  if (!clean) return '';
  const clause = splitWhenClause(clean);
  if (clause) {
    return `when ${clause.condition}, then ${clause.outcome}`;
  }
  return `${clean} when it runs`;
}

/** given style: "given <context>, <behavior>" — falls back gracefully. */
export function givenName(behavior: string): string {
  const clean = normalizeBehavior(behavior);
  if (!clean) return '';
  const clause = splitWhenClause(clean);
  if (clause) {
    return `given ${clause.condition}, ${clause.outcome}`;
  }
  return `given a valid input, ${clean}`;
}

/** BDD describe/it pair derived from the behavior. */
export function bddName(behavior: string): { describe: string; it: string } {
  const clean = normalizeBehavior(behavior);
  if (!clean) {
    return { describe: 'the system under test', it: 'behaves as expected' };
  }
  const clause = splitWhenClause(clean);
  const subject = titleCase(clause ? clause.outcome : clean);
  return {
    describe: clause ? `when ${clause.condition}` : clean,
    it: `it ${clause ? clause.outcome : clean}`,
  };
}

/** ARR-style annotated name: "test_<subject>_given_<context>_expect_<result>". */
export function arrName(behavior: string): string {
  const clean = normalizeBehavior(behavior);
  if (!clean) return '';
  const clause = splitWhenClause(clean);
  const given = titleCase(clause ? clause.condition : 'a valid input');
  const expect = titleCase(clause ? clause.outcome : clean);
  const snake = (phrase: string) =>
    phrase
      .toLowerCase()
      .replace(/[^A-Za-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  return `test_${snake(expect)}_given_${snake(given)}`;
}

/** All conventions at once for the live preview. */
export function suggestNames(behavior: string): NameSuggestions {
  const clean = normalizeBehavior(behavior);
  return {
    should: shouldName(clean),
    whenThen: whenThenName(clean),
    given: givenName(clean),
    bdd: bddName(clean),
    arr: arrName(clean),
  };
}

/** The suggestion for the active convention, or null when the behavior is empty. */
export function conventionName(behavior: string, convention: Convention): string | null {
  const clean = normalizeBehavior(behavior);
  if (!clean) return null;
  switch (convention) {
    case 'should':
      return shouldName(clean);
    case 'when':
      return whenThenName(clean);
    case 'given':
      return givenName(clean);
    case 'bdd':
      return bddName(clean).it;
    case 'arr':
      return arrName(clean);
  }
}

/** Parse batch input: one behavior per line, blank lines and comments skipped. */
export function parseBatchLines(batchText: string): string[] {
  return batchText
    .split('\n')
    .map((line) => normalizeBehavior(line))
    .filter((line) => line.length > 0 && !line.startsWith('#'));
}

/** Batch mode: process every non-empty line into suggestions. */
export function generateBatch(batchText: string): BatchResult[] {
  return parseBatchLines(batchText).map((behavior) => ({
    behavior,
    suggestions: suggestNames(behavior),
  }));
}

/** Validation warnings for vague or overly long descriptions. */
export function validateBehavior(behavior: string): Warning[] {
  const clean = normalizeBehavior(behavior);
  const warnings: Warning[] = [];
  if (!clean) {
    warnings.push({ type: 'empty', message: 'Describe the behavior you want to test.' });
    return warnings;
  }
  if (isVague(clean)) {
    warnings.push({
      type: 'vague',
      message:
        'The description is vague — name the concrete behavior (subject + action + outcome).',
    });
  }
  if (clean.length > MAX_BEHAVIOR_LENGTH) {
    warnings.push({
      type: 'too_long',
      message: `Keep descriptions under ${MAX_BEHAVIOR_LENGTH} characters for readable test names.`,
    });
  }
  if (
    !/\b(starts?|ends?|loads?|saves?|returns?|renders?|throws?|calls?|updates?|creates?|deletes?|fails?|passes?|sends?|sets?|adds?|removes?|rejects?|resolves?|handles?|ignores?|validates?|formats?|maps?|filters?|sorts?|emits?|triggers?|contains?|shows?|hides?|disables?|enables?|cancels?|retries?|expands?|collapses?|toggles?|computes?|calculates?|parses?|builds?|writes?|reads?|fetches?)\b/i.test(
      clean
    )
  ) {
    warnings.push({
      type: 'no_verb',
      message: 'The description does not contain an action verb; test names read best with one.',
    });
  }
  return warnings;
}

/** Quote a candidate subject/outcome snippet for a test name. */
export function quoteSnippet(value: string): string {
  return `'${value.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
}

/**
 * Export generated names as a Jest/Vitest test snippet.
 * When `batchText` is provided it is batch-processed; otherwise the single
 * behavior is used.
 */
export function exportSnippet(
  state: ToolState,
  useBatch = false
): { framework: Framework; code: string } {
  const framework = state.framework;
  const rows: BatchResult[] = useBatch
    ? generateBatch(state.batchText)
    : parseBatchLines(state.behavior).map((behavior) => ({
        behavior,
        suggestions: suggestNames(behavior),
      }));

  const lines: string[] = [];
  for (const row of rows) {
    lines.push(`describe(${quoteSnippet(row.suggestions.bdd.describe)}, () => {`);
    lines.push(`  it(${quoteSnippet(row.suggestions.bdd.it)}, () => {`);
    lines.push('    // arrange');
    lines.push('    // act');
    lines.push('    // assert');
    lines.push('  });');
    lines.push('});');
  }

  const header = framework === 'vitest' ? "import { describe, it, expect } from 'vitest';" : '';
  const code = header ? [header, '', ...lines].join('\n') : lines.join('\n');
  return { framework, code };
}

/** One-line summary used by the status bar and copy actions. */
export function summaryText(state: ToolState): string {
  const warnings = validateBehavior(state.behavior);
  if (warnings.some((w) => w.type === 'empty')) {
    return `${CONVENTIONS.find((c) => c.value === state.convention)?.label ?? state.convention}: describe a behavior to generate a test name`;
  }
  const label = conventionName(state.behavior, state.convention);
  return `${CONVENTIONS.find((c) => c.value === state.convention)?.label ?? state.convention}: ${label ?? normalizeBehavior(state.behavior)}`;
}

/** Build a history entry text for the current state. */
export function historyText(state: ToolState): string {
  return summaryText(state);
}

export function isState(value: unknown): value is ToolState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ToolState>;
  return (
    typeof v.behavior === 'string' && v.convention !== undefined && DEFAULT_STATE !== undefined
  );
}
