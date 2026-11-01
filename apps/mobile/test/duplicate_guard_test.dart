import 'package:flutter_test/flutter_test.dart';
import 'package:monion_mobile/features/scanner/duplicate_guard.dart';

void main() {
  final t0 = DateTime.utc(2026, 10, 1, 7, 30);

  test('rejects the same identifier inside the debounce window', () {
    final guard = DuplicateGuard();
    expect(guard.mayAccept('U-0001', t0), isTrue);
    expect(guard.mayAccept('U-0001', t0.add(const Duration(milliseconds: 1999))),
        isFalse);
  });

  test('accepts the same identifier again once the window has passed', () {
    final guard = DuplicateGuard();
    expect(guard.mayAccept('U-0001', t0), isTrue);
    expect(guard.mayAccept('U-0001', t0.add(const Duration(seconds: 2))), isTrue);
  });

  test('accepts a different identifier immediately', () {
    final guard = DuplicateGuard();
    expect(guard.mayAccept('U-0001', t0), isTrue);
    expect(guard.mayAccept('U-0002', t0), isTrue);
  });

  test('cardLeftRegion allows an immediate rescan', () {
    final guard = DuplicateGuard();
    expect(guard.mayAccept('U-0001', t0), isTrue);
    guard.cardLeftRegion();
    expect(guard.mayAccept('U-0001', t0.add(const Duration(milliseconds: 10))),
        isTrue);
  });

  test('honours a custom debounce', () {
    final guard =
        DuplicateGuard(visibleCardDebounce: const Duration(milliseconds: 500));
    expect(guard.mayAccept('X', t0), isTrue);
    expect(guard.mayAccept('X', t0.add(const Duration(milliseconds: 499))),
        isFalse);
    expect(guard.mayAccept('X', t0.add(const Duration(milliseconds: 1000))),
        isTrue);
  });
}
