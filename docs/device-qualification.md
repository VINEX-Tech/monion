# Device and installation qualification

> Trial plan. Every number below is a target for a future trial, not a
> measured result. No device has been qualified yet. A Samsung SM-A546E is the
> first candidate phone for the trial. `evaluateTrial` in
> `apps/mobile/lib/features/qualification/device_qualification.dart` encodes
> part of these rules and is covered by unit tests.

Model names are never approvals. Each app installation begins `PENDING` and an
administrator assigns `APPROVED`, `LIMITED`, or `REJECTED` after reviewing the
same physical trial. `LIMITED` means scan/GPS pass but phone-side camera
recording failed, so the bus runs `SD_ONLY`.

## Provisional minimum specification

Android 10/API 29, arm64, 3 GB RAM (4 GB with RTSP recording), autofocus rear
camera, torch, usable 720p YUV stream, nominal 8 MP sensor, functional GPS/Play
services, compatible Wi-Fi/hotspot, calculated free storage, and preferably
continuous vehicle power. Specifications do not override a failed trial.

Enrollment reports app installation UUID, manufacturer/model, Android/security
patch/app versions, ABI/cores/RAM, app storage, battery optimization, camera
sizes/FPS/focus/torch/Camera2 level, GPS/Wi-Fi/hotspot/permissions, and trial
metrics. It must not collect IMEI, hardware serial, contacts, or unrelated data.

## Repeatable trial (planned)

1. Run at least 1,000 labeled attempts spanning university QR and national-ID
   cards in daylight, shade, glare, mild defocus, shake, distances, and rotation.
2. Record latency percentiles, first/second-pass success, retries, false accepts,
   dropped frames, memory, battery, thermal warnings, and cellular use.
3. Run rapid boarding, then a 30-minute scan/GPS/hotspot/RTSP/sync stress test.
4. Run a soak test for the longest trip and exercise lock/resume, call, cellular
   and hotspot loss, camera restart, battery/storage/thermal pressure, and process
   restart.
5. Targets: zero incorrect accepted identities, QR p50/p95 <= 400/900 ms,
   national-ID p50/p95 <= 800/1800 ms, OCR p95 <= 3 s, next-ready <= 500 ms,
   >=20 QR or >=12 ID boardings/min, >=95% daylight first pass, and >=90% within
   two attempts for adverse scenarios.

Keep the labeled corpus pseudonymous. Qualification output contains metrics and
failure categories, never raw frames or readable national IDs.
