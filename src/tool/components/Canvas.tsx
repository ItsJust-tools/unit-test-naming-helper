'use client';

import React from 'react';
import { conventionName, suggestNames, validateBehavior } from '../naming';
import {
  CONVENTIONS,
  VALID_CONVENTIONS,
  VALID_FRAMEWORKS,
  type Convention,
  type ToolState,
} from '../types';

interface CanvasProps {
  state: ToolState;
  onChange?: (state: ToolState) => void;
  onSaveHistory?: (text: string) => void;
}

const inputClass =
  'mt-1 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100';

export const Canvas: React.FC<CanvasProps> = ({ state, onChange, onSaveHistory }) => {
  const update = (patch: Partial<ToolState>) => onChange?.({ ...state, ...patch });
  const warnings = validateBehavior(state.behavior);
  const isEmpty = warnings.some((w) => w.type === 'empty');
  const activeName = conventionName(state.behavior, state.convention);
  const suggestions = suggestNames(state.behavior);

  return (
    <div className="p-4 space-y-6 overflow-y-auto h-full" data-testid="naming-canvas">
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
          Describe the behavior under test
          <textarea
            rows={3}
            value={state.behavior}
            onChange={(e) => update({ behavior: e.target.value })}
            data-testid="input-behavior"
            placeholder="e.g. saves the draft when the user clicks save"
            className={inputClass}
          />
        </label>
        {isEmpty ? (
          <p
            role="alert"
            data-testid="warning-empty"
            className="mt-2 text-xs text-amber-700 dark:text-amber-300"
          >
            Describe the behavior you want to test.
          </p>
        ) : null}
        {warnings
          .filter((w) => w.type !== 'empty')
          .map((w) => (
            <p
              key={w.type}
              role="alert"
              data-testid={`warning-${w.type}`}
              className="mt-1 text-xs text-amber-700 dark:text-amber-300"
            >
              {w.message}
            </p>
          ))}
      </div>

      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Naming convention"
        data-testid="convention-tabs"
      >
        {CONVENTIONS.map((convention) => (
          <button
            key={convention.value}
            type="button"
            role="tab"
            aria-selected={state.convention === convention.value}
            data-testid={`convention-tab-${convention.value}`}
            title={convention.hint}
            onClick={() => {
              const value: Convention = VALID_CONVENTIONS.includes(convention.value)
                ? convention.value
                : 'should';
              update({ convention: value });
            }}
            className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
              state.convention === convention.value
                ? 'border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
            }`}
          >
            {convention.label}
          </button>
        ))}
      </div>

      <div
        className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        data-testid="result-card"
        role="status"
      >
        <span className="mb-1 block text-[10px] uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Suggested name ({state.convention})
        </span>
        <span className="font-mono text-lg font-bold break-all" data-testid="result-main">
          {activeName ?? '—'}
        </span>
        {activeName ? (
          <button
            type="button"
            data-testid="btn-save-history"
            onClick={() => onSaveHistory?.(activeName)}
            className="mt-3 ml-3 rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
          >
            Save to history
          </button>
        ) : null}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          All conventions
        </h3>
        <ul
          className="space-y-1 text-xs text-gray-700 dark:text-gray-300"
          data-testid="preview-list"
        >
          <li className="font-mono" data-testid="preview-should">
            should: {suggestions.should || '—'}
          </li>
          <li className="font-mono" data-testid="preview-when">
            when/then: {suggestions.whenThen || '—'}
          </li>
          <li className="font-mono" data-testid="preview-given">
            given: {suggestions.given || '—'}
          </li>
          <li className="font-mono" data-testid="preview-bdd">
            BDD: describe({suggestions.bdd.describe || '—'}) / it({suggestions.bdd.it || '—'})
          </li>
          <li className="font-mono" data-testid="preview-arr">
            ARR: {suggestions.arr || '—'}
          </li>
        </ul>
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Batch mode — one behavior per line
        </h3>
        <textarea
          rows={4}
          value={state.batchText}
          onChange={(e) => update({ batchText: e.target.value })}
          data-testid="input-batch"
          placeholder={'loads the user profile\nthrows when the id is missing'}
          className={inputClass}
        />
        {state.batchText.trim() ? (
          <ul className="mt-2 space-y-1 text-xs" data-testid="batch-results">
            {state.batchText
              .split('\n')
              .map((line) => line.trim().replace(/[.!?]+$/, ''))
              .filter((line) => line.length > 0 && !line.startsWith('#'))
              .map((behavior) => (
                <li key={behavior} className="font-mono text-gray-700 dark:text-gray-300">
                  {conventionName(behavior, state.convention) ?? '—'}
                </li>
              ))}
          </ul>
        ) : null}
      </div>

      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-gray-900/50">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Export snippet
        </h3>
        <div
          className="flex gap-2"
          role="group"
          aria-label="Framework"
          data-testid="framework-tabs"
        >
          {VALID_FRAMEWORKS.map((framework) => (
            <button
              key={framework}
              type="button"
              data-testid={`framework-${framework}`}
              aria-selected={state.framework === framework}
              onClick={() => update({ framework })}
              className={`rounded-md border px-3 py-1.5 text-xs font-medium ${
                state.framework === framework
                  ? 'border-sky-500 bg-sky-50 text-sky-800 dark:bg-sky-900/40 dark:text-sky-100'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'
              }`}
            >
              {framework}
            </button>
          ))}
        </div>
        {state.batchText.trim() ? (
          <p className="mt-2 text-xs text-gray-600 dark:text-gray-300" data-testid="snippet-hint">
            Batch snippets use the behavior description; export from the toolbar to copy the code.
          </p>
        ) : null}
      </div>

      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
          History
        </h3>
        {state.history.length === 0 ? (
          <p className="text-xs text-gray-500 dark:text-gray-400" data-testid="history-empty">
            No saved names yet.
          </p>
        ) : (
          <ul className="space-y-1 text-xs" data-testid="history-list">
            {state.history.map((entry) => (
              <li key={entry.createdAt} className="font-mono text-gray-700 dark:text-gray-300">
                {entry.text}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
