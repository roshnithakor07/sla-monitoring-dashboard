import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Neon's free-tier compute suspends when idle and can take several
    // seconds to wake on the first query of a test run.
    testTimeout: 20000,
    hookTimeout: 20000,
  },
});
