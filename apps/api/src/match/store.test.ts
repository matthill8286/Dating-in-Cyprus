import { describe, expect, it } from 'vitest';
import { isParty, MemoryLoopStore, otherParty } from './store';

describe('MemoryLoopStore', () => {
  it('records Interest once and opens one Match when mutual', async () => {
    const loop = new MemoryLoopStore();
    expect(await loop.recordInterest('a', 'b')).toBe(true);
    expect(await loop.recordInterest('a', 'b')).toBe(false);
    expect(await loop.hasInterest('a', 'b')).toBe(true);
    expect(await loop.hasInterest('b', 'a')).toBe(false);
    const first = await loop.ensureMatch('b', 'a');
    const second = await loop.ensureMatch('a', 'b');
    expect(first.created).toBe(true);
    expect(second).toEqual({ matchId: first.matchId, created: false });
    const match = await loop.findMatch(first.matchId);
    expect(match && isParty(match, 'a')).toBe(true);
    expect(match ? otherParty(match, 'a') : '').toBe('b');
    await loop.close();
  });

  it('hides passed, Interested, and Matched people from discovery', async () => {
    const loop = new MemoryLoopStore();
    await loop.recordPass('a', 'skip');
    await loop.recordInterest('a', 'like');
    await loop.ensureMatch('a', 'pair');
    const hidden = await loop.hiddenIds('a');
    expect(hidden.has('skip')).toBe(true);
    expect(hidden.has('like')).toBe(true);
    expect(hidden.has('pair')).toBe(true);
    await loop.recordBlock('a', 'blocked');
    const after = await loop.hiddenIds('a');
    expect(after.has('blocked')).toBe(true);
    expect(await loop.isBlocked('blocked', 'a')).toBe(true);
    expect(await loop.hasPass('a', 'skip')).toBe(true);
    await loop.close();
  });

  it('stores chat only on the Match thread', async () => {
    const loop = new MemoryLoopStore();
    const { matchId } = await loop.ensureMatch('a', 'b');
    const sent = await loop.addMessage(matchId, 'a', 'hello');
    const listed = await loop.listMessages(matchId);
    expect(sent.body).toBe('hello');
    expect(listed).toHaveLength(1);
    expect(listed[0]?.fromId).toBe('a');
    await loop.close();
  });
});
