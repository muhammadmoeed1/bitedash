import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Pure unit/integration tests never hit a real database, but config/env.ts validates
    // these at import time — provide well-formed dummy values so it doesn't exit(1).
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      JWT_ACCESS_SECRET: 'test-access-secret-not-for-real-use',
      JWT_REFRESH_SECRET: 'test-refresh-secret-not-for-real-use',
      NODE_ENV: 'test',
      LOG_LEVEL: 'silent',
    },
    exclude: ['node_modules', 'dist', 'src/generated'],
    // This dev environment's CPU/IO throughput varies a lot (seen elsewhere in the project as
    // slow Neon round-trips and slow npm installs); the defaults are too tight for the heavier
    // integration test file's first-import cost.
    testTimeout: 15000,
    hookTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['src/generated/**', '**/*.test.ts', 'dist/**'],
    },
  },
});
