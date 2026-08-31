import { defineConfig } from 'vitest/config';

export default defineConfig({
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
