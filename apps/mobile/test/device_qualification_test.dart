import 'package:flutter_test/flutter_test.dart';
import 'package:monion_mobile/features/qualification/device_qualification.dart';

void main() {
  test('recording failure yields SD_ONLY limited qualification', () {
    const result = TrialResult(
        scanAccuracy: .98,
        incorrectAccepts: 0,
        qrP95Ms: 600,
        nationalIdP95Ms: 1400,
        gpsStable: true,
        recordingStable: false,
        permissionFailures: 0);
    expect(evaluateTrial(result), Qualification.limited);
  });
  test('any incorrect accepted identity rejects the installation', () {
    const result = TrialResult(
        scanAccuracy: .999,
        incorrectAccepts: 1,
        qrP95Ms: 300,
        nationalIdP95Ms: 700,
        gpsStable: true,
        recordingStable: true,
        permissionFailures: 0);
    expect(evaluateTrial(result), Qualification.rejected);
  });
}
