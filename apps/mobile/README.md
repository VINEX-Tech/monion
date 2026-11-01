# Monion mobile (prototype)

Android-first Flutter app. The current build is a universal barcode scanner:
torch, zoom, camera switch, and duplicate suppression through `ScanIntake` and
`DuplicateGuard`. Scanned values are shown on screen, kept in memory only and
never uploaded.

| File | State |
| --- | --- |
| `lib/main.dart` | Scanner screen, uses `ScanIntake` |
| `lib/features/scanner/scan_intake.dart`, `duplicate_guard.dart` | Wired into the scanner, tested |
| `lib/features/scanner/scan_pipeline.dart` | Tested with fakes. Not connected to the camera yet: it needs per-frame quality data and an offline roster, which do not exist yet |
| `lib/features/offline/sync_queue.dart` | Interfaces and an ordered drainer, tested with an in-memory store. No durable store, so no offline sync yet |
| `lib/features/qualification/device_qualification.dart` | Trial pass/fail rules using target thresholds, tested |

## Run

```bash
flutter pub get
flutter analyze
flutter test
flutter run --profile    # on a USB-connected phone with USB debugging enabled
```

## Signing

`android/app/build.gradle.kts` signs release builds with the Android debug key
so prototype APKs install on test phones. This is deliberate for the
prototype and not suitable for distribution. Before any real deployment, add a
release keystore kept outside the repository (`key.properties` and `*.jks` are
already ignored by git).
