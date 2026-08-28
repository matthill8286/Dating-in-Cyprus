import { describe, expect, it } from 'vitest';
import { createSessionToken, verifySessionToken } from './sessionToken';

const secret = 'a'.repeat(32);

describe('sessionToken', () => {
  it('accepts a token for the same Account', () => {
    const token = createSessionToken(secret, 'acc-1');
    expect(verifySessionToken(secret, token)?.accountId).toBe('acc-1');
  });

  it('rejects a tampered token', () => {
    const token = createSessionToken(secret, 'acc-1');
    const [payload] = token.split('.');
    expect(verifySessionToken(secret, `${payload}.aaaa`)).toBeNull();
  });

  it('rejects a malformed token', () => {
    expect(verifySessionToken(secret, 'not-a-token')).toBeNull();
  });

  it('rejects an expired token', () => {
    const token = createSessionToken(secret, 'acc-1', -1);
    expect(verifySessionToken(secret, token)).toBeNull();
  });
});
