import type { Gender, LaunchLanguage, Seeking } from '../account/store';
import type { AccountStore } from '../account/store';
import type { LoopStore } from '../match/store';
import type { OperatingAreaCity } from '../profile/model';
import type { ProfileStore } from '../profile/store';

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

export const SEED_PEOPLE: SeedPerson[] = [
  person('Elena', '1997-03-14', 'en', 'woman', 'men', '01', 'Limassol', ['en'],
    'Limassol resident. Shipping by week, the marina at the weekend.',
    'photo-1494790108377-be9c29b29330'),
  person('Oksana', '1994-06-02', 'uk', 'woman', 'men', '02', 'Limassol', ['uk', 'en', 'ru'],
    'Kyiv to Limassol. Morning swims, evening walks in Molos. This is home now.',
    'photo-1534528741775-53994a69daeb'),
  person('Maria', '1999-11-21', 'ro', 'woman', 'men', '03', 'Nicosia', ['ro', 'en'],
    'I teach in Nicosia and drive to the sea on Friday. Settled, not passing through.',
    'photo-1524504388940-b1c1722653e1'),
  person('Irina', '1992-01-09', 'ru', 'woman', 'men', '04', 'Limassol', ['ru', 'en'],
    'Year-round in Limassol. Quiet mornings in the old town.',
    'photo-1517841905240-472988babdf9'),
  person('Anna', '2000-04-18', 'en', 'woman', 'men', '05', 'Larnaca', ['en'],
    'Near the salt lake. Larnaca is home, not a stop on the way to the airport.',
    'photo-1487412720507-e7ab37603c6f'),
  person('Kateryna', '1995-08-30', 'uk', 'woman', 'men', '06', 'Limassol', ['uk', 'en'],
    'Product work from Germasogeia. Weekends on the beach path.',
    'photo-1529626455594-4ff0802cfb7e'),
  person('Ioana', '1998-02-12', 'ro', 'woman', 'men', '07', 'Paphos', ['ro', 'en'],
    'The quieter west of the island. Still here in winter.',
    'photo-1531746020798-e6953c6c8e76'),
  person('Sofia', '2002-07-07', 'bg', 'woman', 'men', '08', 'Limassol', ['bg', 'en'],
    'First years on the island and already staying. Coffee at Columbia.',
    'photo-1544005313-94ddf0286df2'),
  person('Natalia', '1990-09-25', 'ru', 'woman', 'men', '09', 'Nicosia', ['ru', 'en', 'uk'],
    'Finance in Nicosia. Walks in Athalassa after work.',
    'photo-1508214751196-bcfd4ca60f91'),
  person('Daria', '2003-05-16', 'en', 'woman', 'men', '10', 'Ayia Napa', ['en', 'ru'],
    'I live here. Summer crowds are not the same thing as a holiday.',
    'photo-1488426862026-3ee34a7d66df'),
  person('Viktoria', '1996-12-03', 'uk', 'woman', 'men', '11', 'Larnaca', ['uk', 'en'],
    'Mackenzie in the morning, then work. Larnaca through the year.',
    'photo-1525134479668-1bee5c7c6845'),
  person('Teodora', '1993-10-19', 'bg', 'woman', 'men', '12', 'Paralimni', ['bg', 'en'],
    'Family here. Weekends in Protaras, not a tourist let.',
    'photo-1502823403499-6ccfcf4fb453'),
  person('Alex', '1991-04-04', 'en', 'man', 'women', '13', 'Limassol', ['en'],
    'Limassol harbour side. Here for the long run.',
    'photo-1500648767791-00dcc994a43e'),
  person('Dimitri', '1997-08-22', 'ru', 'man', 'women', '14', 'Nicosia', ['ru', 'en'],
    'Nicosia most days, the coast when the heat breaks.',
    'photo-1506794778202-cad84cf45f1d'),
  person('Niko', '1995-01-28', 'bg', 'man', 'women', '15', 'Larnaca', ['bg', 'en'],
    'Larnaca resident. Finikoudes at dusk, then home.',
    'photo-1492562080023-ab3db95bfbce'),
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
      photos: [{ photoId: `seed-${item.firstName.toLowerCase()}`, url: item.photoUrl }],
    });
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
    photoUrl: `https://images.unsplash.com/${unsplashId}?auto=format&fit=crop&w=900&h=1200&q=80`,
  };
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
