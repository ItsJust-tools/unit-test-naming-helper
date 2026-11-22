'use client';

import React from 'react';
import { CONVENTIONS, type ToolState } from '../types';

interface SidebarProps {
  state: ToolState;
  onChange: (next: ToolState) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ state, onChange }) => {
  return (
    <div className="p-4 space-y-6 text-sm overflow-y-auto h-full" data-testid="naming-sidebar">
      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Conventions</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          {CONVENTIONS.map((convention) => (
            <li key={convention.value} className="flex justify-between gap-2">
              <span>{convention.label}</span>
              <span className="text-gray-500 dark:text-gray-400">{convention.hint}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Currently showing:{' '}
          <button
            type="button"
            data-testid="sidebar-convention"
            onClick={() =>
              onChange({
                ...state,
                convention:
                  state.convention === 'should'
                    ? 'when'
                    : state.convention === 'when'
                      ? 'given'
                      : state.convention === 'given'
                        ? 'bdd'
                        : state.convention === 'bdd'
                          ? 'arr'
                          : 'should',
              })
            }
            className="underline"
          >
            {state.convention}
          </button>{' '}
          (click to cycle)
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Saved names</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300" data-testid="sidebar-history-count">
          {state.history.length} entr{state.history.length === 1 ? 'y' : 'ies'} in history
          {state.history.length > 0 ? ' (newest first)' : ''}
        </p>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Keyboard shortcuts</h3>
        <ul className="space-y-1 text-xs text-gray-600 dark:text-gray-300">
          <li>
            <kbd>G</kbd> — focus behavior input
          </li>
          <li>
            <kbd>B</kbd> — batch mode panel
          </li>
          <li>
            <kbd>Y</kbd> — copy current name
          </li>
        </ul>
      </div>

      <div>
        <h3 className="mb-2 font-medium text-gray-900 dark:text-gray-100">Share</h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Use the toolbar share button to create a URL containing the current behavior, convention
          and batch text; open it to restore this state.
        </p>
      </div>
    </div>
  );
};
