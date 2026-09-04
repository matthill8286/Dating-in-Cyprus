import { Pool } from 'pg';
import type { IntroStatus, IntroductionRecord, IntroStore } from './store';

const DDL = `
  CREATE TABLE IF NOT EXISTS introductions (
    introduction_id UUID PRIMARY KEY,
    viewer_id UUID NOT NULL,
    profile_id UUID NOT NULL,
    account_id UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL,
    want TEXT
  );
  CREATE INDEX IF NOT EXISTS introductions_live
    ON introductions (viewer_id, status, created_at DESC)
    WHERE status IN ('open', 'queued');
  CREATE TABLE IF NOT EXISTS introduction_wants (
    viewer_id UUID PRIMARY KEY,
    want TEXT NOT NULL
  );
`;

type Row = {
  introduction_id: string;
  viewer_id: string;
  profile_id: string;
  account_id: string;
  created_at: Date | string;
  expires_at: Date | string;
  status: IntroStatus;
  want: string | null;
};

const SELECT_COLS =
  'introduction_id, viewer_id, profile_id, account_id, created_at, expires_at, status, want';

function toRecord(row: Row): IntroductionRecord {
  return {
    introductionId: row.introduction_id,
    viewerId: row.viewer_id,
    profileId: row.profile_id,
    accountId: row.account_id,
    createdAt: new Date(row.created_at).toISOString(),
    expiresAt: new Date(row.expires_at).toISOString(),
    status: row.status,
    ...(row.want == null ? {} : { want: row.want }),
  };
}

export class PostgresIntroStore implements IntroStore {
  private readonly pool: Pool;
  private ready: Promise<void> | null = null;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  private ensure(): Promise<void> {
    this.ready ??= this.pool.query(DDL).then(() => undefined);
    return this.ready;
  }

  async findOpen(viewerId: string): Promise<IntroductionRecord | null> {
    return this.findByStatus(viewerId, 'open');
  }

  async findQueued(viewerId: string): Promise<IntroductionRecord | null> {
    return this.findByStatus(viewerId, 'queued');
  }

  private async findByStatus(
    viewerId: string,
    status: IntroStatus,
  ): Promise<IntroductionRecord | null> {
    await this.ensure();
    const result = await this.pool.query<Row>(
      `SELECT ${SELECT_COLS} FROM introductions
         WHERE viewer_id = $1 AND status = $2
         ORDER BY created_at DESC LIMIT 1`,
      [viewerId, status],
    );
    const row = result.rows[0];
    return row ? toRecord(row) : null;
  }

  async findById(introductionId: string): Promise<IntroductionRecord | null> {
    await this.ensure();
    const result = await this.pool.query<Row>(
      `SELECT ${SELECT_COLS} FROM introductions WHERE introduction_id = $1`,
      [introductionId],
    );
    const row = result.rows[0];
    return row ? toRecord(row) : null;
  }

  async save(record: IntroductionRecord): Promise<void> {
    await this.ensure();
    await this.pool.query(
      `INSERT INTO introductions
         (introduction_id, viewer_id, profile_id, account_id, created_at, expires_at, status, want)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (introduction_id) DO UPDATE
         SET status = EXCLUDED.status, expires_at = EXCLUDED.expires_at, want = EXCLUDED.want`,
      [
        record.introductionId,
        record.viewerId,
        record.profileId,
        record.accountId,
        record.createdAt,
        record.expiresAt,
        record.status,
        record.want ?? null,
      ],
    );
  }

  async mark(introductionId: string, status: IntroStatus): Promise<void> {
    await this.ensure();
    await this.pool.query(`UPDATE introductions SET status = $2 WHERE introduction_id = $1`, [
      introductionId,
      status,
    ]);
  }

  async rememberWant(viewerId: string, want: string): Promise<void> {
    await this.ensure();
    await this.pool.query(
      `INSERT INTO introduction_wants (viewer_id, want) VALUES ($1, $2)
       ON CONFLICT (viewer_id) DO UPDATE SET want = EXCLUDED.want`,
      [viewerId, want],
    );
  }

  async lastWant(viewerId: string): Promise<string | undefined> {
    await this.ensure();
    const result = await this.pool.query<{ want: string }>(
      `SELECT want FROM introduction_wants WHERE viewer_id = $1`,
      [viewerId],
    );
    return result.rows[0]?.want;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
