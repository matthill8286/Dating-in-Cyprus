import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'cobertura'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/server.ts',
        'src/account/postgres.ts',
        'src/profile/postgres.ts',
        'src/match/postgres.ts',
      ],
      thresholds: {
        lines: 80,
        statements: 80,
        functions: 75,
        branches: 70,
      },
    },
  },
});
