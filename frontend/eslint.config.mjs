/**
 * ESLint flat config (v9+) — replaces the legacy `.eslintrc` format.
 *
 * Extends the Next.js recommended presets:
 *  1. `core-web-vitals` — enforces Core Web Vitals best practices (e.g. image sizes,
 *     script loading strategies)
 *  2. `typescript` — TypeScript-aware rules (no-any, strict boolean expressions, etc.)
 *
 * The `globalIgnores` call overrides the default ignore patterns that ship with
 * `eslint-config-next` to prevent linting build artifacts and auto-generated files.
 */
import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  globalIgnores(['.next/**', 'out/**', 'build/**', 'next-env.d.ts']),
]);

export default eslintConfig;
