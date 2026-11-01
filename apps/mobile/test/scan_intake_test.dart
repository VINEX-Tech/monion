import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:monion_mobile/features/scanner/scan_intake.dart';

void main() {
  late DateTime now;
  late ScanIntake intake;

  setUp(() {
    now = DateTime.utc(2026, 10, 1, 7, 30);
    intake = ScanIntake(clock: () => now);
  });

  test('accepts the first non-blank barcode and trims it', () {
    final scan = intake.accept(const [
      Barcode(rawValue: '   ', format: BarcodeFormat.code128),
      Barcode(rawValue: ' U-0001 ', format: BarcodeFormat.qrCode),
    ]);
    expect(scan?.value, 'U-0001');
    expect(scan?.format, BarcodeFormat.qrCode);
    expect(scan?.scannedAt, now);
  });

  test('returns null for an empty or blank detection', () {
    expect(intake.accept(const []), isNull);
    expect(intake.accept(const [Barcode(rawValue: null)]), isNull);
  });

  test('suppresses repeat frames of the same card', () {
    const frame = [Barcode(rawValue: 'U-0001', format: BarcodeFormat.qrCode)];
    expect(intake.accept(frame), isNotNull);
    now = now.add(const Duration(milliseconds: 300));
    expect(intake.accept(frame), isNull);
  });

  test('reset allows the same card to be scanned again at once', () {
    const frame = [Barcode(rawValue: 'U-0001', format: BarcodeFormat.qrCode)];
    expect(intake.accept(frame), isNotNull);
    intake.reset();
    expect(intake.accept(frame), isNotNull);
  });
}
