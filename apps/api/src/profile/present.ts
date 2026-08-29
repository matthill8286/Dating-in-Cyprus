import { ageInYears } from '../account/age';
import type { Account } from '../account/store';
import type { Profile } from './store';

export function presentProfile(profile: Profile, account: Account, now: Date) {
  return {
    profileId: profile.profileId,
    accountId: profile.accountId,
    firstName: profile.firstName,
    age: ageInYears(account.dateOfBirth, now),
    city: profile.city,
    languagesSpoken: profile.languagesSpoken,
    bio: profile.bio,
    photos: profile.photos,
  };
}
