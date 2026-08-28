import { describe, expect, it, vi } from 'vitest';
import {
  completeJoin,
  joinAgeStatus,
  joinApiErrorCode,
  joinRefusalMessage,
  storeJoinSession,
  validateJoinForm,
  type JoinFormValues,
} from './join';

const now = new Date('2026-08-28T12:00:00.000Z');

const adult: JoinFormValues = {
  email: 'ada@example.com',
  password: 'password1',
  dateOfBirth: '2005-08-28',
  launchLanguage: 'en',
  gender: 'man',
  seeking: 'women',
  specialCategoryConsent: true,
};

describe('joinAgeStatus', () => {
  it('allows join on the 21st birthday', () => {
    expect(joinAgeStatus('2005-08-28', now)).toBe('ok');
  });

  it('refuses join the day before the 21st birthday', () => {
    expect(joinAgeStatus('2005-08-29', now)).toBe('age_ineligible');
  });

  it('refuses a date that is not a day', () => {
    expect(joinAgeStatus('not-a-date', now)).toBe('age_ineligible');
  });
});

describe('validateJoinForm', () => {
  it('accepts an adult with consent and a Launch language', () => {
    expect(validateJoinForm(adult, now)).toBe('ok');
  });

  it('refuses under 21 before calling the API', () => {
    expect(validateJoinForm({ ...adult, dateOfBirth: '2005-08-29' }, now)).toBe(
      'age_ineligible',
    );
  });

  it('refuses missing special-category consent', () => {
    expect(validateJoinForm({ ...adult, specialCategoryConsent: false }, now)).toBe(
      'invalid',
    );
  });
});

describe('storeJoinSession', () => {
  it('stores the session token after a successful join', async () => {
    let token: string | null = null;
    const result = await storeJoinSession((value) => {
      token = value;
    }, { ok: true, token: 'sess-1' });
    expect(result).toEqual({ ok: true, token: 'sess-1' });
    expect(token).toBe('sess-1');
  });

  it('does not store a token when join is refused', async () => {
    let token: string | null = null;
    await storeJoinSession((value) => {
      token = value;
    }, { ok: false, code: 'age_ineligible' });
    expect(token).toBeNull();
  });
});

describe('completeJoin', () => {
  it('does not post when the form is under 21', async () => {
    const post = vi.fn();
    let token: string | null = null;
    const result = await completeJoin(
      { ...adult, dateOfBirth: '2005-08-29' },
      post,
      (value) => {
        token = value;
      },
      now,
    );
    expect(result).toEqual({ ok: false, code: 'age_ineligible' });
    expect(post).not.toHaveBeenCalled();
    expect(token).toBeNull();
  });

  it('stores the session after the API accepts join', async () => {
    let token: string | null = null;
    const result = await completeJoin(
      adult,
      async () => ({ data: { token: 'sess-2' } }),
      (value) => {
        token = value;
      },
      now,
    );
    expect(result).toEqual({ ok: true, token: 'sess-2' });
    expect(token).toBe('sess-2');
  });

  it('shows the API refusal and keeps no session', async () => {
    let token: string | null = null;
    const result = await completeJoin(
      adult,
      async () => ({ error: { code: 'age_ineligible' } }),
      (value) => {
        token = value;
      },
      now,
    );
    expect(result).toEqual({ ok: false, code: 'age_ineligible' });
    expect(token).toBeNull();
  });

  it('treats an empty API body as a failed join', async () => {
    const result = await completeJoin(adult, async () => ({}), () => undefined, now);
    expect(result).toEqual({ ok: false, code: 'error' });
  });
});

describe('joinApiErrorCode', () => {
  it('reads a code from an API error body', () => {
    expect(joinApiErrorCode({ code: 'conflict' })).toBe('conflict');
  });

  it('falls back when the body has no code', () => {
    expect(joinApiErrorCode(null)).toBe('error');
    expect(joinApiErrorCode({ code: 409 })).toBe('error');
  });
});

describe('joinRefusalMessage', () => {
  it('explains under 21', () => {
    expect(joinRefusalMessage('age_ineligible')).toBe('You must be 21 or over to join.');
  });

  it('explains invalid form fields', () => {
    expect(joinRefusalMessage('invalid')).toBe(
      'Check email, password, Launch language, and consent.',
    );
  });

  it('uses a generic message for other API failures', () => {
    expect(joinRefusalMessage('conflict')).toBe('Join failed.');
  });
});
