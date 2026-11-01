import { defineConfig } from 'vitest/config';

// Runs only the PostgreSQL-backed suite. Requires DATABASE_URL pointing at a
// migrated database (see docs/local-development.md).
export default defineConfig({
  test: {
    include: ['test/**/*.pg.test.ts'],
    fileParallelism: false,
    testTimeout: 20000,
    hookTimeout: 30000,
  },
});
