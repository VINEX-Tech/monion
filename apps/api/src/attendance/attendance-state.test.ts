import { describe, expect, it } from 'vitest';
import { assertAttendanceTransition } from './attendance-state';

describe('immutable attendance state machine', () => {
  it.each([
    [null, 'IN'],
    ['IN', 'OUT'],
    ['OUT', 'IN'],
  ] as const)('accepts %s -> %s', (previous, requested) => {
    expect(() => assertAttendanceTransition(previous, requested)).not.toThrow();
  });

  it.each([
    ['IN', 'IN'],
    ['OUT', 'OUT'],
    [null, 'OUT'],
  ] as const)('rejects %s -> %s', (previous, requested) => {
    expect(() => assertAttendanceTransition(previous, requested)).toThrow();
  });
});
