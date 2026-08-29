import { describe, expect, it } from 'vitest';
import { hasDatingIntentLabel } from '../profile/model';
import { MemoryLoopStore } from '../match/store';
import { MemoryAccountStore } from '../account/store';
import { MemoryProfileStore } from '../profile/store';
import {
  applySeed,
  menSeekingWomen,
  SEED_PASSWORD,
  SEED_PEOPLE,
  womenSeekingMen,
} from './seedPeople';

describe('seed people', () => {
  it('is mostly women seeking men', () => {
    const women = womenSeekingMen();
    const men = SEED_PEOPLE.filter((person) => person.gender === 'man');
    expect(women.length).toBeGreaterThanOrEqual(10);
    expect(women.length).toBeGreaterThan(men.length);
    expect(men.every((person) => person.seeking === 'women')).toBe(true);
    expect(women.every((person) => person.seeking === 'men')).toBe(true);
    expect(SEED_PASSWORD).toBe('password1');
  });

  it('keeps dating-intent labels out of bios', () => {
    for (const person of SEED_PEOPLE) {
      expect(hasDatingIntentLabel(person)).toBe(false);
    }
  });

  it('uses unique emails and Cyprus mobiles', () => {
    const emails = SEED_PEOPLE.map((person) => person.email);
    const mobiles = SEED_PEOPLE.map((person) => person.mobile);
    expect(new Set(emails).size).toBe(emails.length);
    expect(new Set(mobiles).size).toBe(mobiles.length);
    expect(mobiles.every((mobile) => /^\+3579\d{7}$/.test(mobile))).toBe(true);
  });

  it('gives every Profile three portrait photos', () => {
    const urls = SEED_PEOPLE.map((item) => item.photoUrl);
    expect(urls.every((url) => url.startsWith('https://images.unsplash.com/'))).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('writes a Resident Profile that can be seeded twice', async () => {
    const accounts = new MemoryAccountStore();
    const profiles = new MemoryProfileStore();
    const hash = () => 'seed:hash';
    const first = await applySeed(accounts, profiles, hash);
    const second = await applySeed(accounts, profiles, hash);
    expect(first).toEqual({ created: SEED_PEOPLE.length, reused: 0, inbound: 0 });
    expect(second).toEqual({ created: 0, reused: SEED_PEOPLE.length, inbound: 0 });
    await expectSeededElena(accounts, profiles);
    await accounts.close();
    await profiles.close();
  });

  it('lets seed women express Interest in seed men without opening a Match', async () => {
    const accounts = new MemoryAccountStore();
    const profiles = new MemoryProfileStore();
    const loop = new MemoryLoopStore();
    const result = await applySeed(accounts, profiles, () => 'seed:hash', loop);
    expect(result.inbound).toBe(womenSeekingMen().length * menSeekingWomen().length);
    const elena = await accounts.findByEmail('seed.elena@here.local');
    const alex = await accounts.findByEmail('seed.alex@here.local');
    expect(elena && alex && (await loop.hasInterest(elena.id, alex.id))).toBe(true);
    expect(alex && (await loop.hasInterest(alex.id, elena?.id ?? ''))).toBe(false);
    expect(alex && (await loop.listMatches(alex.id))).toEqual([]);
    await loop.close();
    await accounts.close();
    await profiles.close();
  });
});

async function expectSeededElena(
  accounts: MemoryAccountStore,
  profiles: MemoryProfileStore,
) {
  const elena = await accounts.findByEmail('seed.elena@here.local');
  expect(elena?.gender).toBe('woman');
  expect(elena?.seeking).toBe('men');
  expect(elena?.residentAdmitted).toBe(true);
  const profile = await profiles.findByAccountId(elena?.id ?? '');
  expect(profile?.firstName).toBe('Elena');
  expect(profile?.photos).toHaveLength(3);
  expect(new Set(profile?.photos.map((photo) => photo.url)).size).toBe(3);
  expect(profile?.photos[0]?.url).toContain('images.unsplash.com');
}
