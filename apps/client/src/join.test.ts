import { describe, expect, it, vi } from 'vitest';
import {
  completeJoin,
  joinAgeStatus,
  joinApiErrorCode,
  joinInvalidMessage,
  joinRefusalMessage,
  joinStepComplete,
  localFromMobile,
  mobileFromLocal,
  monthDays,
  nextJoinStep,
  prevJoinStep,
  isoDate,
  shiftCalendarMonth,
  birthdayLabel,
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
  mobile: '+35799123456',
  primaryHomeAttestation: true,
  presence: { latitude: 34.685, longitude: 33.038 },
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

  it('refuses a number that is not a Cyprus mobile', () => {
    expect(validateJoinForm({ ...adult, mobile: '+447700900123' }, now)).toBe('invalid');
  });

  it('refuses missing primary-home attestation', () => {
    expect(validateJoinForm({ ...adult, primaryHomeAttestation: false }, now)).toBe(
      'invalid',
    );
  });

  it('refuses missing presence', () => {
    expect(validateJoinForm({ ...adult, presence: null }, now)).toBe('invalid');
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
      async () => ({ error: { code: 'visitor_refused' } }),
      (value) => {
        token = value;
      },
      now,
    );
    expect(result).toEqual({ ok: false, code: 'visitor_refused' });
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

describe('joinInvalidMessage', () => {
  it('names an empty email', () => {
    expect(joinInvalidMessage({ ...adult, email: '' })).toBe('Enter a valid email.');
  });

  it('names a short password', () => {
    expect(joinInvalidMessage({ ...adult, password: 'short' })).toBe(
      'Password must be at least 8 characters.',
    );
  });

  it('names an incomplete Cyprus mobile', () => {
    expect(joinInvalidMessage({ ...adult, mobile: '+357' })).toBe(
      'Enter a Cyprus mobile number starting +3579.',
    );
  });
});

describe('joinRefusalMessage', () => {
  it('explains under 21', () => {
    expect(joinRefusalMessage('age_ineligible')).toBe('You must be 21 or over to join.');
  });

  it('explains invalid form fields', () => {
    expect(joinRefusalMessage('invalid')).toBe('Check the form and try again.');
  });

  it('explains a Visitor refused at the gate', () => {
    expect(joinRefusalMessage('visitor_refused')).toBe(
      'Only a Resident can join. A Visitor is refused at the gate.',
    );
  });

  it('uses a generic message for other API failures', () => {
    expect(joinRefusalMessage('conflict')).toBe('Join failed.');
  });
});

describe('join wizard steps', () => {
  it('walks email → mobile → identity → seeking → birthday → island', () => {
    expect(nextJoinStep('email')).toBe('mobile');
    expect(nextJoinStep('island')).toBe('done');
    expect(prevJoinStep('email')).toBe('exit');
    expect(prevJoinStep('mobile')).toBe('email');
  });

  it('completes each step only with valid fields', () => {
    expect(joinStepComplete('email', adult)).toBe(true);
    expect(joinStepComplete('email', { ...adult, password: 'short' })).toBe(false);
    expect(joinStepComplete('mobile', { ...adult, mobile: '+357' })).toBe(false);
    expect(joinStepComplete('birthday', { ...adult, dateOfBirth: '' }, now)).toBe(false);
    expect(joinStepComplete('birthday', adult, now)).toBe(true);
    expect(joinStepComplete('island', { ...adult, presence: null })).toBe(false);
    expect(joinStepComplete('island', adult)).toBe(true);
  });

  it('builds a Cyprus mobile from local digits and a birthday calendar', () => {
    expect(mobileFromLocal('99123456')).toBe('+35799123456');
    expect(localFromMobile('+35799123456')).toBe('99123456');
    expect(isoDate(1995, 7, 11)).toBe('1995-07-11');
    expect(shiftCalendarMonth('1995-07-11', 1)).toBe('1995-08-11');
    expect(monthDays('1995-07-11')[6]).toBe(1);
    expect(birthdayLabel('1995-07-11')).toContain('1995');
    expect(birthdayLabel('')).toBe('Choose birthday date');
  });
});
