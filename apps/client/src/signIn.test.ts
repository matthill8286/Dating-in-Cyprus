import { describe, expect, it, vi } from 'vitest';
import { completeSignIn, signInRefusalMessage, validateSignIn } from './signIn';

describe('validateSignIn', () => {
  it('accepts an email and a password of 8 characters', () => {
    expect(validateSignIn({ email: 'ada@example.com', password: 'password1' })).toBe('ok');
  });

  it('refuses a missing email', () => {
    expect(validateSignIn({ email: '', password: 'password1' })).toBe('invalid');
  });

  it('refuses a short password', () => {
    expect(validateSignIn({ email: 'ada@example.com', password: 'short' })).toBe('invalid');
  });
});

describe('completeSignIn', () => {
  it('does not post when the form is invalid', async () => {
    const post = vi.fn();
    let token: string | null = null;
    const result = await completeSignIn(
      { email: '', password: '' },
      post,
      (value) => {
        token = value;
      },
    );
    expect(result).toEqual({ ok: false, code: 'invalid' });
    expect(post).not.toHaveBeenCalled();
    expect(token).toBeNull();
  });

  it('stores the session after the API accepts sign in', async () => {
    let token: string | null = null;
    const result = await completeSignIn(
      { email: 'ada@example.com', password: 'password1' },
      async () => ({ data: { token: 'sess-3' } }),
      (value) => {
        token = value;
      },
    );
    expect(result).toEqual({ ok: true, token: 'sess-3' });
    expect(token).toBe('sess-3');
  });

  it('keeps no session when email or password is wrong', async () => {
    let token: string | null = null;
    const result = await completeSignIn(
      { email: 'ada@example.com', password: 'password1' },
      async () => ({ error: { code: 'unauthenticated' } }),
      (value) => {
        token = value;
      },
    );
    expect(result).toEqual({ ok: false, code: 'unauthenticated' });
    expect(token).toBeNull();
  });
});

describe('signInRefusalMessage', () => {
  it('asks for email and password when the form is invalid', () => {
    expect(signInRefusalMessage('invalid')).toBe('Enter your email and password.');
  });

  it('explains a wrong email or password', () => {
    expect(signInRefusalMessage('unauthenticated')).toBe('Email or password is wrong.');
  });

  it('explains when the phone cannot reach the API', () => {
    expect(signInRefusalMessage('network')).toMatch(/Cannot reach Here/);
  });
});
