export type DeviceStatus = 'PENDING' | 'APPROVED' | 'LIMITED' | 'REJECTED' | 'REVOKED';

export function mayStartTrip(status: DeviceStatus): boolean {
  return status === 'APPROVED' || status === 'LIMITED';
}

export function cameraMode(status: DeviceStatus): 'LOCAL_RECORDING' | 'SD_ONLY' | null {
  if (status === 'APPROVED') return 'LOCAL_RECORDING';
  if (status === 'LIMITED') return 'SD_ONLY';
  return null;
}
