import { Pool } from 'pg';
import {
  AccountConflict,
  GENDERS,
  LAUNCH_LANGUAGES,
  SEEKING,
  type Account,
  type AccountStore,
  type Gender,
  type LaunchLanguage,
  type NewAccount,
  type Seeking,
} from './store';

const CREATE_TABLE = `
  CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    launch_language TEXT NOT NULL,
    gender TEXT NOT NULL,
    seeking TEXT NOT NULL,
    mobile TEXT NOT NULL DEFAULT '',
    resident_admitted BOOLEAN NOT NULL DEFAULT false
  )
`;

const MIGRATE = `
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS mobile TEXT NOT NULL DEFAULT '';
  ALTER TABLE accounts ADD COLUMN IF NOT EXISTS resident_admitted BOOLEAN NOT NULL DEFAULT false;
`;

type AccountRow = {
  id: string;
  email: string;
  password_hash: string;
  date_of_birth: string;
  launch_language: string;
  gender: string;
  seeking: string;
  mobile: string;
  resident_admitted: boolean;
};

function isUniqueViolation(err: unknown): boolean {
  return Reflect.get(Object(err), 'code') === '23505';
}

function oneOf<T extends string>(allowed: readonly T[], value: string, label: string): T {
  const found = allowed.find((item) => item === value);
  if (!found) throw new Error(`corrupt Account ${label}`);
  return found;
}

function toAccount(row: AccountRow): Account {
  return {
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    dateOfBirth: row.date_of_birth.slice(0, 10),
    launchLanguage: oneOf<LaunchLanguage>(LAUNCH_LANGUAGES, row.launch_language, 'launch_language'),
    gender: oneOf<Gender>(GENDERS, row.gender, 'gender'),
    seeking: oneOf<Seeking>(SEEKING, row.seeking, 'seeking'),
    mobile: row.mobile,
    residentAdmitted: row.resident_admitted,
  };
}

export class PostgresAccountStore implements AccountStore {
  private readonly pool: Pool;
  private ready: Promise<void> | null = null;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  private ensure(): Promise<void> {
    this.ready ??= this.pool
      .query(CREATE_TABLE)
      .then(() => this.pool.query(MIGRATE))
      .then(() => undefined);
    return this.ready;
  }

  async create(account: NewAccount): Promise<Account> {
    await this.ensure();
    const id = crypto.randomUUID();
    try {
      await this.pool.query(
        `INSERT INTO accounts
          (id, email, password_hash, date_of_birth, launch_language, gender, seeking, mobile, resident_admitted)
         VALUES ($1, $2, $3, $4::date, $5, $6, $7, $8, $9)`,
        [
          id,
          account.email.toLowerCase(),
          account.passwordHash,
          account.dateOfBirth,
          account.launchLanguage,
          account.gender,
          account.seeking,
          account.mobile,
          account.residentAdmitted,
        ],
      );
      return { ...account, id, email: account.email.toLowerCase() };
    } catch (err) {
      if (isUniqueViolation(err)) throw new AccountConflict();
      throw err;
    }
  }

  async findByEmail(email: string): Promise<Account | null> {
    await this.ensure();
    const result = await this.pool.query<AccountRow>(
      `SELECT id, email, password_hash, date_of_birth::text AS date_of_birth,
              launch_language, gender, seeking, mobile, resident_admitted
         FROM accounts
        WHERE email = $1`,
      [email.toLowerCase()],
    );
    const row = result.rows[0];
    return row ? toAccount(row) : null;
  }

  async findById(id: string): Promise<Account | null> {
    await this.ensure();
    const result = await this.pool.query<AccountRow>(
      `SELECT id, email, password_hash, date_of_birth::text AS date_of_birth,
              launch_language, gender, seeking, mobile, resident_admitted
         FROM accounts
        WHERE id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? toAccount(row) : null;
  }

  async findManyByIds(ids: string[]): Promise<Account[]> {
    if (ids.length === 0) return [];
    await this.ensure();
    const result = await this.pool.query<AccountRow>(
      `SELECT id, email, password_hash, date_of_birth::text AS date_of_birth,
              launch_language, gender, seeking, mobile, resident_admitted
         FROM accounts
        WHERE id = ANY($1::uuid[])`,
      [ids],
    );
    return result.rows.map(toAccount);
  }

  async listAdmitted(): Promise<Account[]> {
    await this.ensure();
    const result = await this.pool.query<AccountRow>(
      `SELECT id, email, password_hash, date_of_birth::text AS date_of_birth,
              launch_language, gender, seeking, mobile, resident_admitted
         FROM accounts
        WHERE resident_admitted = true`,
    );
    return result.rows.map(toAccount);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
