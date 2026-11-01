# Local development

1. `cp .env.example .env` and change the passwords.
2. `npm ci`
3. `docker compose -f infra/compose.yaml up -d` starts the local services. All
   ports bind to 127.0.0.1. Defaults: PostgreSQL 5432, MinIO 9000 and console
   9001, Mailpit UI 8025, mock university roster 3100, mock push 3200. Set
   `POSTGRES_PORT` and the other `*_PORT` variables in `.env` if a port is
   taken.
4. `npm run db:generate && npm run db:deploy` creates the tables.
5. `npm run dev` starts the API. Set `API_HOST=0.0.0.0` only on a trusted
   network; the API has no authentication yet.

## Tests

- `bash scripts/verify.sh` runs lint, typecheck, unit and HTTP tests, contract
  validation, builds and, when Flutter is available, `flutter analyze` and
  `flutter test`. Set `FLUTTER=/path/to/flutter` if it is not on `PATH`.
- `bash scripts/test-postgres.sh` starts a throwaway PostgreSQL on port 55432,
  applies the migration, checks the schema matches `schema.prisma`, runs the
  PostgreSQL HTTP suite and removes the container.

## USB phone

For a USB phone use `adb reverse tcp:3000 tcp:3000` (or
`scripts/android-usb.sh`), then the phone reaches the API at
`http://127.0.0.1:3000/v1`. The current scanner build does not call the API.
