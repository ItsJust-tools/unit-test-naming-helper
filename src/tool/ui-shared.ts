import { CONVENTIONS, DEFAULT_STATE, type ToolState } from './types';

export { CONVENTIONS };

export function isState(value: unknown): value is ToolState {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Partial<ToolState>;
  return (
    typeof v.behavior === 'string' && v.convention !== undefined && DEFAULT_STATE !== undefined
  );
}
