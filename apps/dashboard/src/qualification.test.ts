import { describe, expect, it } from 'vitest';
import { cameraMode, mayStartTrip } from './qualification';

describe('device enforcement', () => {
  it('allows limited devices only in SD_ONLY mode', () => {
    expect(mayStartTrip('LIMITED')).toBe(true);
    expect(cameraMode('LIMITED')).toBe('SD_ONLY');
  });
  it.each(['PENDING', 'REJECTED', 'REVOKED'] as const)('blocks %s devices', status => {
    expect(mayStartTrip(status)).toBe(false);
    expect(cameraMode(status)).toBeNull();
  });
});
