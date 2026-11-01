# Changelog

All notable changes to this project are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow
[Semantic Versioning](https://semver.org/).

## [0.1.0] - 2026-11-01

First public prototype (MVP). Not deployed.

### Added

- `POST /v1/attendance/events`: validated request body, required
  `Idempotency-Key` header, IN/OUT ordering rules in a serializable
  transaction, 200 replay for a repeated key, 409 for a key reused with a
  different body.
- Initial Prisma migration for the 22-model schema.
- Unit tests, HTTP tests with an in-memory database, contract conformance
  tests, and a PostgreSQL HTTP suite (`scripts/test-postgres.sh`).
- Flutter `ScanIntake` wiring `DuplicateGuard` into the scanner screen, with
  tests for the scan pipeline, duplicate guard, intake and sync queue drainer.
- Dashboard mock-data banner and tests that check the labelling.
- Mock university roster paging (`pageToken`, `limit`) with tests.
- ESLint, a `typecheck` script, and a single CI workflow covering Node,
  PostgreSQL, Flutter and gitleaks.
- MIT license.

### Changed

- OpenAPI contract now lists only the implemented endpoints (health and
  attendance events). Device enrollment and GPS batches were removed until
  they are built.
- Local Compose services bind to 127.0.0.1 and take configurable host ports.
- The API listens on 127.0.0.1 unless `API_HOST` is set.
- Release APK artifact renamed to make the debug-key signing explicit.

### Removed

- Unused Flutter and Node dependencies (storage, connectivity, vibration,
  device info, OpenAPI generator, argon2).
