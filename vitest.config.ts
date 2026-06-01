import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { config as dotenvConfig } from 'dotenv';

dotenvConfig({ path: resolve(__dirname, 'tests/config/.env.test') });

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/config/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
      include: ['lib/**', 'app/api/**', 'app/actions.ts', 'store/**', 'hooks/**', 'services/**'],
      exclude: ['**/*.d.ts', '**/node_modules/**', 'lib/prisma.ts'],
    },
    include: [
      'tests/unit/**/*.test.ts',
      'tests/unit/**/*.test.tsx',
      'tests/integration/**/*.test.ts',
      'tests/ui/**/*.test.tsx',
    ],
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
});
