import type { DeserializeResult, ExporterLoader, Tool } from '@itsjust/core';
import toolConfig from './tool.config';
import {
  DEFAULT_STATE,
  MAX_HISTORY,
  VALID_CONVENTIONS,
  VALID_FRAMEWORKS,
  type Convention,
  type Framework,
  type HistoryEntry,
  type ToolState,
} from './types';
import { historyText, summaryText } from './naming';

/** Serialize tool state into a compact JSON string for share/import. */
export function serializeState(state: ToolState): string {
  return JSON.stringify({
    behavior: state.behavior,
    convention: state.convention,
    batchText: state.batchText,
    framework: state.framework,
    history: state.history,
  });
}

function stringOr(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback;
}

function validHistory(value: unknown): HistoryEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (entry): entry is HistoryEntry =>
        typeof entry === 'object' &&
        entry !== null &&
        typeof (entry as HistoryEntry).text === 'string' &&
        typeof (entry as HistoryEntry).createdAt === 'string'
    )
    .slice(0, MAX_HISTORY);
}

/** Validate and recover tool state from an arbitrary payload. */
export function deserializeState(data: unknown): DeserializeResult<ToolState> {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return {
      success: false,
      error: 'Invalid data format: expected unit test naming helper state object',
    };
  }
  const v = data as Record<string, unknown>;
  const convention: Convention = VALID_CONVENTIONS.includes(v.convention as Convention)
    ? (v.convention as Convention)
    : DEFAULT_STATE.convention;
  const framework: Framework = VALID_FRAMEWORKS.includes(v.framework as Framework)
    ? (v.framework as Framework)
    : DEFAULT_STATE.framework;
  const state: ToolState = {
    behavior: stringOr(v.behavior, DEFAULT_STATE.behavior),
    convention,
    batchText: stringOr(v.batchText, DEFAULT_STATE.batchText),
    framework,
    history: validHistory(v.history),
  };
  return { success: true, data: state };
}

/** Append a history entry to state, capped at MAX_HISTORY, newest first. */
export function withHistory(state: ToolState, text: string, now = new Date()): ToolState {
  const entry: HistoryEntry = { text, createdAt: now.toISOString() };
  return { ...state, history: [entry, ...state.history].slice(0, MAX_HISTORY) };
}

/** True when a serialized string round-trips back to the same state. */
export function roundTrips(state: ToolState): boolean {
  try {
    const restored = deserializeState(JSON.parse(serializeState(state)));
    return restored.success && JSON.stringify(restored.data) === JSON.stringify(state);
  } catch {
    return false;
  }
}

export const unitTestNamingHelperTool: Tool<ToolState> = {
  id: toolConfig.id,
  name: toolConfig.name,
  version: toolConfig.version,
  config: toolConfig,
  initialState: { ...DEFAULT_STATE },
  serialize: serializeState,
  deserialize: deserializeState,
  exporters: [
    { format: 'png', loader: (() => import('./exporters/png')) as ExporterLoader },
    { format: 'jpeg', loader: (() => import('./exporters/jpeg')) as ExporterLoader },
    { format: 'webp', loader: (() => import('./exporters/webp')) as ExporterLoader },
    { format: 'pdf', loader: (() => import('./exporters/pdf')) as ExporterLoader },
  ],
};

export { historyText, summaryText };
