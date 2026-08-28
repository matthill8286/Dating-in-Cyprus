import { describe, expect, it } from 'vitest';
import { loadHealth } from './health';

describe('loadHealth', () => {
  it('returns ok when the API is healthy', async () => {
    await expect(loadHealth(async () => ({ data: { status: 'ok' as const } }))).resolves.toBe('ok');
  });

  it('returns error when the API is not healthy', async () => {
    await expect(loadHealth(async () => ({ error: { message: 'down' } }))).resolves.toBe('error');
  });
});
