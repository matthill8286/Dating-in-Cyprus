import { describe, expect, it } from 'vitest';
import { MemoryIntroStore } from './store';

const record = {
  introductionId: 'intro-1',
  viewerId: 'alex',
  profileId: 'p-elena',
  accountId: 'elena',
  createdAt: '2026-08-30T12:00:00.000Z',
  expiresAt: '2026-08-31T12:00:00.000Z',
  status: 'open' as const,
};

describe('intro store', () => {
  it('keeps one open Introduction per viewer and can close it', async () => {
    const store = new MemoryIntroStore();
    await store.save(record);
    expect(await store.findOpen('alex')).toEqual(record);
    expect(await store.findById('intro-1')).toEqual(record);
    expect(await store.findOpen('other')).toBeNull();
    await store.mark('intro-1', 'yes');
    expect((await store.findById('intro-1'))?.status).toBe('yes');
    expect(await store.findOpen('alex')).toBeNull();
    await store.mark('missing', 'passed');
    expect(await store.findById('missing')).toBeNull();
  });
});
