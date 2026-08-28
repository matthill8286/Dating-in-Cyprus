import { describe, expect, it } from 'vitest';
import { hashPassword, passwordMatches } from './password';

describe('password', () => {
  it('matches a hash of the same password', () => {
    const stored = hashPassword('password1');
    expect(passwordMatches('password1', stored)).toBe(true);
    expect(passwordMatches('otherpass', stored)).toBe(false);
  });

  it('rejects a stored value that is not a hash', () => {
    expect(passwordMatches('password1', 'not-a-hash')).toBe(false);
    expect(passwordMatches('password1', 'abcd:00')).toBe(false);
  });
});
