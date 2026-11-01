# Development status

Updated: 2026-11-01 (v0.1.0)

## Done and tested

- Monorepo with npm workspaces and CI (lint, typecheck, tests, builds,
  PostgreSQL suite, Flutter analyze and test, secret scan).
- `GET /v1/health` and `POST /v1/attendance/events` in the NestJS API.
- Prisma schema with an initial migration, drift-checked in CI.
- OpenAPI contract that matches the implemented endpoints, enforced by tests.
- Flutter scanner with duplicate suppression; scan pipeline, device
  qualification rules and sync queue drainer covered by unit tests.
- Dashboard layout with clearly labelled mock data.

## Next

1. Authentication and device enrollment (driver accounts, OTP, refresh-token
   rotation, roles).
2. Trips API and a durable on-device queue so the scanner can post attendance.
3. Connect the scan pipeline to a camera frame source and an offline roster.
4. Dashboard reads from the API instead of mock data.

## Required before any pilot

- Every item under "Next".
- The device trial in `device-qualification.md` on candidate phones.
- The camera trial in `camera-trial.md` on the candidate camera.
- A release signing key managed outside the repository.
- A simulated full trip without data loss.
