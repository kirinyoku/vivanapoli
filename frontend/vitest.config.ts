/**
 * Vitest configuration for the frontend test suite.
 *
 * Key settings:
 *  - `environment: jsdom` — simulates a browser DOM for component tests
 *  - `globals: true` — makes `describe`, `it`, `expect` available without imports
 *  - `setupFiles` — runs `vitest.setup.ts` before each test file (mocks
 *     localStorage, IntersectionObserver)
 *  - `alias['@']` — mirrors the `@/*` path alias from `tsconfig.json` so that
 *     imports like `@/components/ui/Button` resolve in tests as they do at runtime
 */
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
