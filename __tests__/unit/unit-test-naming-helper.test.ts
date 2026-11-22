import { describe, it, expect } from 'vitest';
import {
  normalizeBehavior,
  shouldName,
  whenThenName,
  givenName,
  bddName,
  arrName,
  suggestNames,
  conventionName,
  parseBatchLines,
  generateBatch,
  validateBehavior,
  exportSnippet,
  summaryText,
  titleCase,
  splitIdentifier,
  quoteSnippet,
} from '@/tool/naming';
import {
  deserializeState,
  serializeState,
  withHistory,
  roundTrips,
  unitTestNamingHelperTool,
} from '@/tool/tool-definition';
import { DEFAULT_STATE, MAX_HISTORY, type ToolState } from '@/tool/types';

const state = (patch: Partial<ToolState> = {}): ToolState => ({ ...DEFAULT_STATE, ...patch });

describe('normalizeBehavior', () => {
  it('collapses whitespace and strips trailing punctuation', () => {
    expect(normalizeBehavior('  saves   the draft. ')).toBe('saves the draft');
    expect(normalizeBehavior('loads the page!')).toBe('loads the page');
  });

  it('returns an empty string for blank input', () => {
    expect(normalizeBehavior('   ')).toBe('');
  });
});

describe('should-style names', () => {
  it('generates a should-style name from a behavior description', () => {
    expect(shouldName('loads the user profile')).toBe('should loads the user profile');
    expect(shouldName('Throws when the id is missing')).toBe(
      'should throws when the id is missing'
    );
  });

  it('returns an empty name for empty input', () => {
    expect(shouldName('')).toBe('');
  });
});

describe('BDD when/then names', () => {
  it('generates BDD when/then names from explicit when-clauses', () => {
    expect(whenThenName('when the user clicks save, then the draft is stored')).toBe(
      'when the user clicks save, then the draft is stored'
    );
    expect(whenThenName('when the id is missing, throws an error')).toBe(
      'when the id is missing, then throws an error'
    );
  });

  it('falls back to a when-clause when none is present', () => {
    expect(whenThenName('loads the user profile')).toBe('loads the user profile when it runs');
  });

  it('builds BDD describe/it pairs', () => {
    expect(bddName('when the user clicks save, then the draft is stored')).toEqual({
      describe: 'when the user clicks save',
      it: 'it the draft is stored',
    });
    expect(bddName('').describe).toBe('the system under test');
  });
});

describe('given names', () => {
  it('uses an explicit when-clause as the given context', () => {
    expect(givenName('when the id is missing, throws an error')).toBe(
      'given the id is missing, throws an error'
    );
  });

  it('falls back to a default context', () => {
    expect(givenName('loads the user profile')).toBe('given a valid input, loads the user profile');
  });
});

describe('ARR names', () => {
  it('builds snake_case test_..._given_... names', () => {
    expect(arrName('when the id is missing, throws an error')).toBe(
      'test_throws_an_error_given_the_id_is_missing'
    );
  });

  it('returns empty for empty input', () => {
    expect(arrName('')).toBe('');
  });
});

describe('suggestNames and conventionName', () => {
  it('returns all conventions at once', () => {
    const all = suggestNames('when the user clicks save, then the draft is stored');
    expect(all.should).toContain('should');
    expect(all.whenThen).toContain('when');
    expect(all.given).toContain('given');
    expect(all.bdd.describe).toContain('when');
    expect(all.arr).toMatch(/^test_/);
  });

  it('selects the name for the active convention', () => {
    expect(conventionName('loads the profile', 'should')).toBe('should loads the profile');
    expect(conventionName('loads the profile', 'arr')).toBe(
      'test_loads_the_profile_given_a_valid_input'
    );
    expect(conventionName('', 'should')).toBeNull();
  });
});

describe('titleCase and splitIdentifier', () => {
  it('title-cases phrases keeping small words lower', () => {
    expect(titleCase('loads the user profile')).toBe('Loads the User Profile');
    expect(titleCase('a tale of two cities')).toBe('A Tale of Two Cities');
  });

  it('splits camelCase and snake_case identifiers', () => {
    expect(splitIdentifier('loadUserProfile')).toBe('load User Profile');
    expect(splitIdentifier('load_user_profile')).toBe('load user profile');
  });
});

describe('batch mode', () => {
  it('parses multiple lines skipping blanks and comments', () => {
    expect(parseBatchLines('loads the profile\n\n# ignored\nthrows on bad input\n')).toEqual([
      'loads the profile',
      'throws on bad input',
    ]);
  });

  it('batch mode processes multiple lines', () => {
    const results = generateBatch('loads the profile\nthrows when the id is missing');
    expect(results).toHaveLength(2);
    expect(results[0]?.suggestions.should).toBe('should loads the profile');
    expect(results[1]?.suggestions.should).toBe('should throws when the id is missing');
  });

  it('returns an empty list for empty batch input', () => {
    expect(generateBatch('')).toEqual([]);
  });
});

describe('validation warnings', () => {
  it('shows a validation warning for empty input', () => {
    const warnings = validateBehavior('');
    expect(warnings.some((w) => w.type === 'empty')).toBe(true);
  });

  it('warns on vague descriptions', () => {
    expect(validateBehavior('it works').some((w) => w.type === 'vague')).toBe(true);
    expect(validateBehavior('loads the profile').some((w) => w.type === 'vague')).toBe(false);
  });

  it('warns on overly long descriptions', () => {
    const long = 'loads '.repeat(40).trim();
    expect(validateBehavior(long).some((w) => w.type === 'too_long')).toBe(true);
  });

  it('warns when there is no action verb', () => {
    expect(validateBehavior('the user profile thing').some((w) => w.type === 'no_verb')).toBe(true);
    expect(validateBehavior('loads the user profile').some((w) => w.type === 'no_verb')).toBe(
      false
    );
  });
});

describe('quoteSnippet', () => {
  it('escapes quotes and backslashes', () => {
    expect(quoteSnippet("it's")).toBe("'it\\'s'");
    expect(quoteSnippet('back\\slash')).toBe("'back\\\\slash'");
  });
});

describe('exportSnippet', () => {
  it('emits a jest describe/it snippet by default', () => {
    const { framework, code } = exportSnippet(state({ behavior: 'loads the profile' }));
    expect(framework).toBe('jest');
    expect(code).toContain("describe('loads the profile'");
    expect(code).toContain("it('it loads the profile'");
    expect(code).not.toContain('vitest');
  });

  it('adds a vitest import when the framework is vitest', () => {
    const { framework, code } = exportSnippet(
      state({ behavior: 'loads the profile', framework: 'vitest' })
    );
    expect(framework).toBe('vitest');
    expect(code).toContain("from 'vitest'");
  });

  it('batch mode exports a snippet per line', () => {
    const { code } = exportSnippet(
      state({ batchText: 'loads the profile\nthrows on bad input' }),
      true
    );
    expect((code.match(/describe\(/g) ?? []).length).toBe(2);
  });

  it('emits nothing for empty input', () => {
    const { code } = exportSnippet(state({ behavior: '' }));
    expect(code).toBe('');
  });
});

describe('summaryText', () => {
  it('formats the active convention name', () => {
    expect(summaryText(state({ behavior: 'loads the profile', convention: 'should' }))).toBe(
      'should: should loads the profile'
    );
  });

  it('explains that a behavior is required when input is empty', () => {
    expect(summaryText(state({ behavior: '' }))).toContain('describe a behavior');
  });
});

describe('serialize/deserialize', () => {
  it('round-trips full state', () => {
    const full = state({
      behavior: 'throws when the id is missing',
      convention: 'bdd',
      batchText: 'a\nb',
      framework: 'vitest',
      history: [{ text: 'should x', createdAt: '2026-11-21T10:00:00.000Z' }],
    });
    expect(roundTrips(full)).toBe(true);
    const restored = deserializeState(JSON.parse(serializeState(full)));
    expect(restored).toEqual({ success: true, data: full });
  });

  it('repairs invalid payloads back to defaults', () => {
    const repaired = deserializeState({ nope: true });
    expect(repaired.success).toBe(true);
    if (repaired.success) {
      expect(repaired.data.convention).toBe(DEFAULT_STATE.convention);
      expect(repaired.data.framework).toBe(DEFAULT_STATE.framework);
    }
  });

  it('rejects non-object payloads', () => {
    expect(deserializeState('nope').success).toBe(false);
    expect(deserializeState(null).success).toBe(false);
    expect(deserializeState([]).success).toBe(false);
  });

  it('caps history at MAX_HISTORY', () => {
    let s = state();
    for (let i = 0; i < MAX_HISTORY + 5; i++) {
      s = withHistory(s, `name ${i}`, new Date(2026, 0, 1, 0, 0, i));
    }
    expect(s.history).toHaveLength(MAX_HISTORY);
    expect(s.history[0]?.text).toBe(`name ${MAX_HISTORY + 4}`);
  });

  it('exposes the tool through the standard contract', () => {
    expect(unitTestNamingHelperTool.id).toBe('unit-test-naming-helper');
    expect(unitTestNamingHelperTool.initialState).toEqual(DEFAULT_STATE);
  });
});
