# Architecture and security boundaries

> Design note. This describes the target design. Only the attendance endpoint,
> the database schema and the scanner prototype exist today; see the status
> table in the README. Authentication, roster sync, alerts and selfie storage
> below are not built.

The Android driver app records operations offline first. Every mutation has an
installation-generated idempotency key. The API is authoritative and stores
attendance as an immutable event stream: the only legal sequence is `IN, OUT,
IN, OUT…`. A serializable database transaction rejects consecutive duplicates.

The application keeps a hashed roster lookup index offline. National IDs are
encrypted separately and never appear in logs, metrics, map views, QR bus
claims, or exports by default. Manual entry requires a reason and creates an
audit record. Raw scan frames never leave the phone.

## Authentication

Administrators provision accounts and fixed assignments. Initial login uses an
Argon2id password, expiring email OTP, device enrollment, a secure-storage PIN,
and a reference selfie. Every trip captures a fresh compressed selfie. V1 does
not infer identity from faces. Access JWTs are short-lived; refresh tokens are
hashed, rotated by family, and reuse revokes the family. Revoked devices cannot
start trips. All administrative mutations are RBAC-protected and audited.

Selfies live in a private encrypted S3-compatible bucket with lifecycle rules.
The dashboard receives short-lived signed GET URLs only. Production secrets are
provided by the deployment secret manager, never repository files.

## Roster boundary

The university adapter consumes `{students, nextPageToken, complete}` for both full
and page-token based incremental sync. CSV import maps into the exact same internal
DTO, validates the entire file, reports rejected rows, and only then commits.
The local mock at `infra/mock-university` implements the paging side of this
boundary (`GET /v1/roster?pageToken=&limit=`).

## Alert evaluation

Workers evaluate overdue trips, route deviation, stale GPS, unexpected stops,
camera/recording health, storage, claim conflicts, unresolved passengers, and
SOS. Alert creation is idempotent. Browser/PWA delivery is advisory; the API
record is the durable source of truth.
