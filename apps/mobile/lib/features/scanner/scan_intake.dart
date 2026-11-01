import 'package:mobile_scanner/mobile_scanner.dart';

import 'duplicate_guard.dart';

/// A barcode value the scanner screen has accepted for display.
class AcceptedScan {
  const AcceptedScan(
      {required this.value, required this.format, required this.scannedAt});
  final String value;
  final BarcodeFormat format;
  final DateTime scannedAt;
}

/// Turns raw detections from the camera into accepted scans.
///
/// Picks the first barcode with a non-blank value and passes it through
/// [DuplicateGuard], so a card held in front of the camera is accepted once per
/// debounce window instead of on every frame. Values stay in memory only.
class ScanIntake {
  ScanIntake({DuplicateGuard? guard, DateTime Function()? clock})
      : _guard = guard ?? DuplicateGuard(),
        _clock = clock ?? DateTime.now;

  final DuplicateGuard _guard;
  final DateTime Function() _clock;

  AcceptedScan? accept(List<Barcode> barcodes) {
    for (final barcode in barcodes) {
      final value = barcode.rawValue?.trim();
      if (value == null || value.isEmpty) continue;
      final now = _clock();
      if (!_guard.mayAccept(value, now)) return null;
      return AcceptedScan(value: value, format: barcode.format, scannedAt: now);
    }
    return null;
  }

  /// Called when the operator clears the result, so the same card can be
  /// scanned again straight away.
  void reset() => _guard.cardLeftRegion();
}
