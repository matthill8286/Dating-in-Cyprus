import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  DATING_INTENT_PATTERN,
  hasDatingIntentLabel,
  PROFILE_EDIT_FIELDS,
  profileEditHasIntentControl,
  profileViewText,
  saveProfile,
  validateProfileForm,
  type Profile,
} from './profile';

const profile: Profile = {
  profileId: 'p1',
  accountId: 'a1',
  firstName: 'Ada',
  age: 21,
  city: 'Limassol',
  languagesSpoken: ['en', 'uk'],
  bio: 'Lives in Limassol.',
  photos: [{ photoId: 'ph1', url: 'https://photos.westeurope.example/ph1' }],
};

describe('validateProfileForm', () => {
  it('accepts a lean Profile', () => {
    expect(
      validateProfileForm({
        firstName: 'Ada',
        city: 'Limassol',
        languagesSpoken: ['en'],
        bio: 'Hello.',
      }),
    ).toBe('ok');
  });

  it('refuses a city outside the Operating area', () => {
    expect(
      validateProfileForm({
        firstName: 'Ada',
        city: 'Kyrenia',
        languagesSpoken: ['en'],
        bio: 'Hello.',
      }),
    ).toBe('invalid');
  });

  it('refuses a missing first name', () => {
    expect(
      validateProfileForm({
        firstName: '',
        city: 'Limassol',
        languagesSpoken: ['en'],
        bio: 'Hello.',
      }),
    ).toBe('invalid');
  });
});

describe('Profile view and edit have no dating-intent label', () => {
  it('shows first name, age, city, languages, bio, and photos', () => {
    const text = profileViewText(profile);
    expect(text).toContain('Ada');
    expect(text).toContain('21');
    expect(text).toContain('Limassol');
    expect(text).toContain('en, uk');
    expect(text).toContain('Lives in Limassol.');
    expect(text).toContain('1 photos');
    expect(text).toContain('Unverified');
    expect(hasDatingIntentLabel(text)).toBe(false);
  });

  it('does not put an intent field on the edit form', () => {
    expect(PROFILE_EDIT_FIELDS).toEqual([
      'firstName',
      'city',
      'languagesSpoken',
      'bio',
      'photos',
    ]);
    expect(profileEditHasIntentControl(PROFILE_EDIT_FIELDS)).toBe(false);
  });

  it('keeps dating-intent labels out of the generated client schema', () => {
    const src = readFileSync(
      join(dirname(fileURLToPath(import.meta.url)), 'api/schema.ts'),
      'utf8',
    );
    expect(DATING_INTENT_PATTERN.test(src)).toBe(false);
  });
});

describe('saveProfile', () => {
  it('stores the Profile after a successful save', async () => {
    let stored: Profile | null = null;
    const result = await saveProfile(
      {
        firstName: 'Ada',
        city: 'Limassol',
        languagesSpoken: ['en'],
        bio: 'Hello.',
      },
      async () => ({ data: profile }),
      (value) => {
        stored = value;
      },
    );
    expect(result).toEqual({ ok: true });
    expect(stored).toEqual(profile);
  });

  it('reports a refusal rather than throwing when the API is unreachable', async () => {
    const result = await saveProfile(
      {
        firstName: 'Ada',
        city: 'Limassol',
        languagesSpoken: ['en'],
        bio: 'Hello.',
      },
      async () => {
        throw new TypeError('Network request failed');
      },
      () => undefined,
    );
    expect(result).toEqual({ ok: false, code: 'network' });
  });

  it('does not store a Profile when the form is invalid', async () => {
    const patch = async () => ({ data: profile });
    const result = await saveProfile(
      {
        firstName: '',
        city: 'Limassol',
        languagesSpoken: ['en'],
        bio: 'Hello.',
      },
      patch,
      () => undefined,
    );
    expect(result).toEqual({ ok: false, code: 'invalid' });
  });
});
