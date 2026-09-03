import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      'react-native': join(root, 'src/react-native.stub.ts'),
    },
  },
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'cobertura'],
      include: ['src/health.ts', 'src/host.ts', 'src/intake.ts', 'src/join.ts', 'src/profile.ts'],
      exclude: ['src/**/*.test.ts'],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 75,
        branches: 70,
      },
    },
  },
});
