import { mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { loadEnvFiles } from './loadEnv';

describe('loadEnvFiles', () => {
  it('sets missing keys from a file', () => {
    const dir = join(tmpdir(), `dating-env-${Date.now()}`);
    mkdirSync(dir, { recursive: true });
    const file = join(dir, '.env.example');
    writeFileSync(file, 'DATING_TEST_KEY=from-file\n');
    delete process.env.DATING_TEST_KEY;
    loadEnvFiles([file]);
    expect(process.env.DATING_TEST_KEY).toBe('from-file');
    delete process.env.DATING_TEST_KEY;
  });
});
