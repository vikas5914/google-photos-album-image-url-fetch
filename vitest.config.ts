import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['test/**/*.test.ts'],
    // Network-backed Google Photos checks can be flaky / slow
    testTimeout: 25_000,
    retry: 5,
  },
});
