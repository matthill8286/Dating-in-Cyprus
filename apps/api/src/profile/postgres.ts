import { Pool } from 'pg';
import type { LaunchLanguage } from '../account/store';
import type { OperatingAreaCity } from './model';
import type { PhotoVerificationMark, Profile, ProfileStore, ProfileWrite } from './store';

const DDL = `
  CREATE TABLE IF NOT EXISTS profiles (
    profile_id UUID PRIMARY KEY,
    account_id UUID NOT NULL UNIQUE,
    first_name TEXT NOT NULL,
    city TEXT NOT NULL,
    languages_spoken JSONB NOT NULL,
    bio TEXT NOT NULL,
    photos JSONB NOT NULL
  );
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_verification TEXT NOT NULL DEFAULT 'unverified';
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photo_verified_at TIMESTAMPTZ;
`;

type ProfileRow = {
  profile_id: string;
  account_id: string;
  first_name: string;
  city: string;
  languages_spoken: LaunchLanguage[];
  bio: string;
  photos: Profile['photos'];
  photo_verification: PhotoVerificationMark;
  photo_verified_at: Date | string | null;
};

function toProfile(row: ProfileRow): Profile {
  return {
    profileId: row.profile_id,
    accountId: row.account_id,
    firstName: row.first_name,
    city: row.city as OperatingAreaCity,
    languagesSpoken: row.languages_spoken,
    bio: row.bio,
    photos: row.photos,
    photoVerification: row.photo_verification,
    photoVerifiedAt: row.photo_verified_at ? new Date(row.photo_verified_at).toISOString() : null,
  };
}

const SELECT_COLS =
  'profile_id, account_id, first_name, city, languages_spoken, bio, photos, photo_verification, photo_verified_at';

export class PostgresProfileStore implements ProfileStore {
  private readonly pool: Pool;
  private ready: Promise<void> | null = null;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  private ensure(): Promise<void> {
    this.ready ??= this.pool.query(DDL).then(() => undefined);
    return this.ready;
  }

  async upsert(accountId: string, data: ProfileWrite): Promise<Profile> {
    await this.ensure();
    const existing = await this.findByAccountId(accountId);
    const profileId = existing?.profileId ?? crypto.randomUUID();
    await this.pool.query(
      `INSERT INTO profiles
        (profile_id, account_id, first_name, city, languages_spoken, bio, photos)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb)
       ON CONFLICT (account_id) DO UPDATE SET
         first_name = EXCLUDED.first_name,
         city = EXCLUDED.city,
         languages_spoken = EXCLUDED.languages_spoken,
         bio = EXCLUDED.bio,
         photos = EXCLUDED.photos`,
      [
        profileId,
        accountId,
        data.firstName,
        data.city,
        JSON.stringify(data.languagesSpoken),
        data.bio,
        JSON.stringify(data.photos),
      ],
    );
    return (await this.findByAccountId(accountId)) as Profile;
  }

  async findByAccountId(accountId: string): Promise<Profile | null> {
    await this.ensure();
    const result = await this.pool.query<ProfileRow>(
      `SELECT ${SELECT_COLS} FROM profiles WHERE account_id = $1`,
      [accountId],
    );
    const row = result.rows[0];
    return row ? toProfile(row) : null;
  }

  async findById(profileId: string): Promise<Profile | null> {
    await this.ensure();
    const result = await this.pool.query<ProfileRow>(
      `SELECT ${SELECT_COLS} FROM profiles WHERE profile_id = $1`,
      [profileId],
    );
    const row = result.rows[0];
    return row ? toProfile(row) : null;
  }

  async list(): Promise<Profile[]> {
    await this.ensure();
    const result = await this.pool.query<ProfileRow>(`SELECT ${SELECT_COLS} FROM profiles`);
    return result.rows.map(toProfile);
  }

  async setPhotoVerification(
    accountId: string,
    mark: PhotoVerificationMark,
    at: Date | null,
  ): Promise<void> {
    await this.ensure();
    await this.pool.query(
      `UPDATE profiles SET photo_verification = $2, photo_verified_at = $3 WHERE account_id = $1`,
      [accountId, mark, at],
    );
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
