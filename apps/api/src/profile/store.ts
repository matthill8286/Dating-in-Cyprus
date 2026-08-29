import type { LaunchLanguage } from '../account/store';
import type { OperatingAreaCity } from './model';

export type ProfilePhoto = {
  photoId: string;
  url: string;
};

export type Profile = {
  profileId: string;
  accountId: string;
  firstName: string;
  city: OperatingAreaCity;
  languagesSpoken: LaunchLanguage[];
  bio: string;
  photos: ProfilePhoto[];
};

export type ProfileWrite = Omit<Profile, 'profileId' | 'accountId' | 'photos'> & {
  photos: ProfilePhoto[];
};

export interface ProfileStore {
  upsert(accountId: string, data: ProfileWrite): Promise<Profile>;
  findByAccountId(accountId: string): Promise<Profile | null>;
  findById(profileId: string): Promise<Profile | null>;
  list(): Promise<Profile[]>;
  close(): Promise<void>;
}

export class MemoryProfileStore implements ProfileStore {
  private readonly byAccount = new Map<string, Profile>();
  private readonly byId = new Map<string, Profile>();

  async upsert(accountId: string, data: ProfileWrite): Promise<Profile> {
    const existing = this.byAccount.get(accountId);
    const profile: Profile = {
      ...data,
      accountId,
      profileId: existing?.profileId ?? crypto.randomUUID(),
    };
    this.byAccount.set(accountId, profile);
    this.byId.set(profile.profileId, profile);
    return profile;
  }

  async findByAccountId(accountId: string): Promise<Profile | null> {
    return this.byAccount.get(accountId) ?? null;
  }

  async findById(profileId: string): Promise<Profile | null> {
    return this.byId.get(profileId) ?? null;
  }

  async list(): Promise<Profile[]> {
    return [...this.byId.values()];
  }

  async close(): Promise<void> {
    this.byAccount.clear();
    this.byId.clear();
  }
}
