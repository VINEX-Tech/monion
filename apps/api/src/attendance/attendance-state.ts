export type Direction = 'IN' | 'OUT';

export class AttendanceTransitionError extends Error {
  readonly code = 'INVALID_ATTENDANCE_TRANSITION';
}

/** Pure domain rule used by both the API transaction and offline reconciliation. */
export function assertAttendanceTransition(
  previous: Direction | null,
  requested: Direction,
): void {
  if (previous === requested) {
    throw new AttendanceTransitionError(
      `Duplicate consecutive ${requested} event is not allowed`,
    );
  }
  if (previous === null && requested === 'OUT') {
    throw new AttendanceTransitionError('A passenger cannot exit before entering');
  }
}
