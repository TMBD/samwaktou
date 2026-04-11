/**
 * @file vitest.config.ts
 * @description Vitest configuration for the backend API test suite.
 *
 * Key choices:
 * - `globals: true` — avoids explicit `import { describe, it }` in every file.
 * - `restoreMocks: true` — auto-restores mocks between tests for isolation.
 * - `include` — only picks up `*.test.ts` files inside the `src/` tree.
 * - `setupFiles` — runs the test setup (env stubs, etc.) before every suite.
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    restoreMocks: true,
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/__tests__/setup.ts'],
  },
});
