import { Pool } from 'pg';
import type { PhotoVerificationRecord, PhotoVerificationStore, VerificationStatus } from './verifyStore';

const DDL = `
  CREATE TABLE IF NOT EXISTS photo_verifications (
    photo_verification_id UUID PRIMARY KEY,
    account_id UUID NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL
  )
`;

type Row = {
  photo_verification_id: string;
  account_id: string;
  status: VerificationStatus;
  created_at: Date | string;
  completed_at: Date | string;
};

function toRecord(row: Row): PhotoVerificationRecord {
  return {
    photoVerificationId: row.photo_verification_id,
    accountId: row.account_id,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    completedAt: new Date(row.completed_at).toISOString(),
  };
}

export class PostgresPhotoVerificationStore implements PhotoVerificationStore {
  private readonly pool: Pool;
  private ready: Promise<void> | null = null;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  private ensure(): Promise<void> {
    this.ready ??= this.pool.query(DDL).then(() => undefined);
    return this.ready;
  }

  async create(record: PhotoVerificationRecord): Promise<PhotoVerificationRecord> {
    await this.ensure();
    await this.pool.query(
      `INSERT INTO photo_verifications
        (photo_verification_id, account_id, status, created_at, completed_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [record.photoVerificationId, record.accountId, record.status, record.createdAt, record.completedAt],
    );
    return record;
  }

  async findById(id: string): Promise<PhotoVerificationRecord | null> {
    await this.ensure();
    const result = await this.pool.query<Row>(
      `SELECT photo_verification_id, account_id, status, created_at, completed_at
         FROM photo_verifications WHERE photo_verification_id = $1`,
      [id],
    );
    const row = result.rows[0];
    return row ? toRecord(row) : null;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
