import type { Gender, LaunchLanguage, Seeking } from '../account/store';
import type { AccountStore } from '../account/store';
import type { LoopStore } from '../match/store';
import type { OperatingAreaCity } from '../profile/model';
import type { ProfileStore } from '../profile/store';
import { SEED_ROWS } from './seedRoster';

export const SEED_PASSWORD = 'password1';

export type SeedPerson = {
  email: string;
  firstName: string;
  dateOfBirth: string;
  launchLanguage: LaunchLanguage;
  gender: Gender;
  seeking: Seeking;
  mobile: string;
  city: OperatingAreaCity;
  languagesSpoken: LaunchLanguage[];
  bio: string;
  photoUrl: string;
};

export const SEED_PEOPLE: SeedPerson[] = SEED_ROWS.map((row) => person(...row));

export const WOMAN_EXTRAS = [
  'photo-1438761681033-6461ffad8d80',
  'photo-1531123897727-8f129e1688ce',
  'photo-1554151228-14d9def656e4',
  'photo-1548142813-c348350df52b',
  'photo-1500917293891-ef795e70e1f6',
  'photo-1524502397800-2eeaad7c3fe5',
  'photo-1524250502761-1ac6f2e30d43',
  'photo-1502323777036-f29e3972d82f',
  'photo-1542206395-9feb3edaa68d',
  'photo-1567532939604-b6b5b0db2604',
  'photo-1544005313-94ddf0286df2',
  'photo-1529626455594-4ff0802cfb7e',
  'photo-1515886657613-9f3515b0c78f',
  'photo-1526510747491-58f928ec870f',
  'photo-1479936345342-2b8d650d6278',
  'photo-1573497019236-17f8177b81e8',
  'photo-1541823709867-1b206113eafd',
  'photo-1492633423870-59d1b6ba4496',
];

export const MAN_EXTRAS = [
  'photo-1463453091185-61582044d556',
  'photo-1507003211169-0a1dd7228f2d',
  'photo-1521119989659-a83eee488004',
  'photo-1539571696357-5a69c17a67c6',
  'photo-1547425260-76bcadfb4f2c',
  'photo-1500648767791-00dcc994a43e',
  'photo-1506794778202-cad84cf45f1d',
  'photo-1492562080023-ab3db95bfbce',
  'photo-1472099645785-5658abf4ff4e',
  'photo-1560250097-0b93528c311a',
  'photo-1566492031773-4f4e44671857',
];

export function womenSeekingMen(): SeedPerson[] {
  return SEED_PEOPLE.filter((item) => item.gender === 'woman' && item.seeking === 'men');
}

export function menSeekingWomen(): SeedPerson[] {
  return SEED_PEOPLE.filter((item) => item.gender === 'man' && item.seeking === 'women');
}

export async function applySeed(
  accounts: AccountStore,
  profiles: ProfileStore,
  hash: (password: string) => string,
  loop?: LoopStore,
): Promise<{ created: number; reused: number; inbound: number }> {
  let created = 0;
  let reused = 0;
  let index = 0;
  for (const item of SEED_PEOPLE) {
    const existing = await accounts.findByEmail(item.email);
    const account = existing ?? (await accounts.create(toNewAccount(item, hash)));
    if (existing) reused += 1;
    else created += 1;
    await profiles.upsert(account.id, {
      firstName: item.firstName,
      city: item.city,
      languagesSpoken: item.languagesSpoken,
      bio: item.bio,
      photos: photosFor(item, index),
    });
    index += 1;
  }
  const inbound = loop ? await seedInboundInterest(accounts, loop) : 0;
  return { created, reused, inbound };
}

export async function seedInboundInterest(
  accounts: AccountStore,
  loop: LoopStore,
): Promise<number> {
  const women: string[] = [];
  const men: string[] = [];
  for (const person of SEED_PEOPLE) {
    const account = await accounts.findByEmail(person.email);
    if (!account) continue;
    if (person.gender === 'woman') women.push(account.id);
    else men.push(account.id);
  }
  let inbound = 0;
  for (const womanId of women) {
    for (const manId of men) {
      if (await loop.recordInterest(womanId, manId)) inbound += 1;
    }
  }
  return inbound;
}

export function photosFor(item: SeedPerson, index: number) {
  const extras = item.gender === 'woman' ? WOMAN_EXTRAS : MAN_EXTRAS;
  const own = unsplashId(item.photoUrl);
  const pool = extras.filter((id) => id !== own);
  const first = pool[index % pool.length] ?? pool[0];
  const second = pool[(index + 5) % pool.length] ?? pool[1];
  const extraIds = first === second ? [first, pool[(index + 1) % pool.length]] : [first, second];
  return [item.photoUrl, ...extraIds.map((id) => portraitUrl(id ?? ''))].map((url, photoIndex) => ({
    photoId: `seed-${item.firstName.toLowerCase()}-${photoIndex}`,
    url,
  }));
}

function person(
  firstName: string,
  dateOfBirth: string,
  launchLanguage: LaunchLanguage,
  gender: Gender,
  seeking: Seeking,
  mobileSuffix: string,
  city: OperatingAreaCity,
  languagesSpoken: LaunchLanguage[],
  bio: string,
  unsplashId: string,
): SeedPerson {
  return {
    email: `seed.${firstName.toLowerCase()}@here.local`,
    firstName,
    dateOfBirth,
    launchLanguage,
    gender,
    seeking,
    mobile: `+35799000${mobileSuffix.padStart(3, '0')}`,
    city,
    languagesSpoken,
    bio,
    photoUrl: portraitUrl(unsplashId, firstName),
  };
}

function portraitUrl(unsplashId: string, tag?: string): string {
  const base = `https://images.unsplash.com/${unsplashId}?auto=format&fit=crop&w=900&h=1200&q=80`;
  return tag ? `${base}&n=${tag.toLowerCase()}` : base;
}

export function unsplashId(url: string): string {
  return url.match(/images\.unsplash\.com\/(photo-[^?]+)/)?.[1] ?? url;
}

function toNewAccount(item: SeedPerson, hash: (password: string) => string) {
  return {
    email: item.email,
    passwordHash: hash(SEED_PASSWORD),
    dateOfBirth: item.dateOfBirth,
    launchLanguage: item.launchLanguage,
    gender: item.gender,
    seeking: item.seeking,
    mobile: item.mobile,
    residentAdmitted: true,
  };
}
