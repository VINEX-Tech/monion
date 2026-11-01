enum Qualification { pending, approved, limited, rejected }

class TrialResult {
  const TrialResult(
      {required this.scanAccuracy,
      required this.incorrectAccepts,
      required this.qrP95Ms,
      required this.nationalIdP95Ms,
      required this.gpsStable,
      required this.recordingStable,
      required this.permissionFailures});
  final double scanAccuracy;
  final int incorrectAccepts, qrP95Ms, nationalIdP95Ms, permissionFailures;
  final bool gpsStable, recordingStable;
}

Qualification evaluateTrial(TrialResult result) {
  if (result.incorrectAccepts > 0 ||
      result.scanAccuracy < .95 ||
      result.qrP95Ms > 900 ||
      result.nationalIdP95Ms > 1800 ||
      !result.gpsStable ||
      result.permissionFailures > 0) {
    return Qualification.rejected;
  }
  if (!result.recordingStable) {
    return Qualification.limited;
  }
  return Qualification.approved;
}
