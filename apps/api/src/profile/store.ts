import type { LaunchLanguage } from '../account/store';
import type { OperatingAreaCity } from './model';

export type ProfilePhoto = {
  photoId: string;
  url: string;
};

export type PhotoVerificationMark = 'unverified' | 'verified';

export type Profile = {
  profileId: string;
  accountId: string;
  firstName: string;
  city: OperatingAreaCity;
  languagesSpoken: LaunchLanguage[];
  bio: string;
  photos: ProfilePhoto[];
  photoVerification: PhotoVerificationMark;
  photoVerifiedAt: string | null;
};

export type ProfileWrite = Omit<
  Profile,
  'profileId' | 'accountId' | 'photos' | 'photoVerification' | 'photoVerifiedAt'
> & {
  photos: ProfilePhoto[];
};

export interface ProfileStore {
  upsert(accountId: string, data: ProfileWrite): Promise<Profile>;
  findByAccountId(accountId: string): Promise<Profile | null>;
  findManyByAccountIds(accountIds: string[]): Promise<Profile[]>;
  findById(profileId: string): Promise<Profile | null>;
  list(): Promise<Profile[]>;
  setPhotoVerification(
    accountId: string,
    mark: PhotoVerificationMark,
    at: Date | null,
  ): Promise<void>;
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
      photoVerification: existing?.photoVerification ?? 'unverified',
      photoVerifiedAt: existing?.photoVerifiedAt ?? null,
    };
    this.byAccount.set(accountId, profile);
    this.byId.set(profile.profileId, profile);
    return profile;
  }

  async findByAccountId(accountId: string): Promise<Profile | null> {
    return this.byAccount.get(accountId) ?? null;
  }

  async findManyByAccountIds(accountIds: string[]): Promise<Profile[]> {
    return accountIds.flatMap((accountId) => {
      const profile = this.byAccount.get(accountId);
      return profile ? [profile] : [];
    });
  }

  async findById(profileId: string): Promise<Profile | null> {
    return this.byId.get(profileId) ?? null;
  }

  async list(): Promise<Profile[]> {
    return [...this.byId.values()];
  }

  async setPhotoVerification(
    accountId: string,
    mark: PhotoVerificationMark,
    at: Date | null,
  ): Promise<void> {
    const existing = this.byAccount.get(accountId);
    if (!existing) return;
    const next = {
      ...existing,
      photoVerification: mark,
      photoVerifiedAt: at ? at.toISOString() : null,
    };
    this.byAccount.set(accountId, next);
    this.byId.set(next.profileId, next);
  }

  async close(): Promise<void> {
    this.byAccount.clear();
    this.byId.clear();
  }
}
