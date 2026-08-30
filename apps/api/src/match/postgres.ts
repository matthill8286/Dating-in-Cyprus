import { Pool } from 'pg';
import type { ChatMessage, LoopStore, MatchRecord, SafetyReport } from './store';

const DDL = `
  CREATE TABLE IF NOT EXISTS interests (
    from_id UUID NOT NULL,
    to_id UUID NOT NULL,
    PRIMARY KEY (from_id, to_id)
  );
  CREATE TABLE IF NOT EXISTS passes (
    from_id UUID NOT NULL,
    to_id UUID NOT NULL,
    PRIMARY KEY (from_id, to_id)
  );
  CREATE TABLE IF NOT EXISTS matches (
    match_id UUID PRIMARY KEY,
    a_id UUID NOT NULL,
    b_id UUID NOT NULL,
    UNIQUE (a_id, b_id)
  );
  CREATE TABLE IF NOT EXISTS messages (
    message_id UUID PRIMARY KEY,
    match_id UUID NOT NULL,
    from_id UUID NOT NULL,
    body TEXT NOT NULL,
    sent_at TIMESTAMPTZ NOT NULL
  );
  CREATE TABLE IF NOT EXISTS blocks (
    from_id UUID NOT NULL,
    to_id UUID NOT NULL,
    PRIMARY KEY (from_id, to_id)
  );
  CREATE TABLE IF NOT EXISTS reports (
    report_id UUID PRIMARY KEY,
    reporter_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
  );
`;

export class PostgresLoopStore implements LoopStore {
  private readonly pool: Pool;
  private ready: Promise<void> | null = null;

  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString });
  }

  private ensure(): Promise<void> {
    this.ready ??= this.pool.query(DDL).then(() => undefined);
    return this.ready;
  }

  async recordInterest(fromId: string, toId: string): Promise<boolean> {
    await this.ensure();
    const result = await this.pool.query(
      `INSERT INTO interests (from_id, to_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [fromId, toId],
    );
    return (result.rowCount ?? 0) > 0;
  }

  async hasInterest(fromId: string, toId: string): Promise<boolean> {
    await this.ensure();
    const result = await this.pool.query(
      `SELECT 1 FROM interests WHERE from_id = $1 AND to_id = $2`,
      [fromId, toId],
    );
    return Boolean(result.rows[0]);
  }

  async recordPass(fromId: string, toId: string): Promise<void> {
    await this.ensure();
    await this.pool.query(
      `INSERT INTO passes (from_id, to_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [fromId, toId],
    );
  }

  async hasPass(fromId: string, toId: string): Promise<boolean> {
    await this.ensure();
    const result = await this.pool.query(
      `SELECT 1 FROM passes WHERE from_id = $1 AND to_id = $2`,
      [fromId, toId],
    );
    return Boolean(result.rows[0]);
  }

  async hiddenIds(fromId: string): Promise<Set<string>> {
    await this.ensure();
    const result = await this.pool.query<{ id: string }>(
      `SELECT to_id AS id FROM interests WHERE from_id = $1
       UNION SELECT to_id AS id FROM passes WHERE from_id = $1
       UNION SELECT b_id AS id FROM matches WHERE a_id = $1
       UNION SELECT a_id AS id FROM matches WHERE b_id = $1
       UNION SELECT to_id AS id FROM blocks WHERE from_id = $1
       UNION SELECT from_id AS id FROM blocks WHERE to_id = $1`,
      [fromId],
    );
    return new Set(result.rows.map((row) => row.id));
  }

  async ensureMatch(aId: string, bId: string): Promise<{ matchId: string; created: boolean }> {
    await this.ensure();
    const a = aId < bId ? aId : bId;
    const b = aId < bId ? bId : aId;
    const existing = await this.pool.query<MatchRecord>(
      `SELECT match_id AS "matchId", a_id AS "aId", b_id AS "bId" FROM matches WHERE a_id = $1 AND b_id = $2`,
      [a, b],
    );
    if (existing.rows[0]) return { matchId: existing.rows[0].matchId, created: false };
    const matchId = crypto.randomUUID();
    await this.pool.query(`INSERT INTO matches (match_id, a_id, b_id) VALUES ($1, $2, $3)`, [
      matchId,
      a,
      b,
    ]);
    return { matchId, created: true };
  }

  async listMatches(accountId: string): Promise<MatchRecord[]> {
    await this.ensure();
    const result = await this.pool.query<MatchRecord>(
      `SELECT match_id AS "matchId", a_id AS "aId", b_id AS "bId"
         FROM matches WHERE a_id = $1 OR b_id = $1`,
      [accountId],
    );
    return result.rows;
  }

  async findMatch(matchId: string): Promise<MatchRecord | null> {
    await this.ensure();
    const result = await this.pool.query<MatchRecord>(
      `SELECT match_id AS "matchId", a_id AS "aId", b_id AS "bId" FROM matches WHERE match_id = $1`,
      [matchId],
    );
    return result.rows[0] ?? null;
  }

  async dropMatch(matchId: string): Promise<MatchRecord | null> {
    await this.ensure();
    const match = await this.findMatch(matchId);
    if (!match) return null;
    await this.pool.query(`DELETE FROM messages WHERE match_id = $1`, [matchId]);
    await this.pool.query(`DELETE FROM matches WHERE match_id = $1`, [matchId]);
    await this.pool.query(
      `DELETE FROM interests WHERE (from_id = $1 AND to_id = $2) OR (from_id = $2 AND to_id = $1)`,
      [match.aId, match.bId],
    );
    return match;
  }

  async addMessage(matchId: string, fromId: string, body: string): Promise<ChatMessage> {
    await this.ensure();
    const message: ChatMessage = {
      messageId: crypto.randomUUID(),
      matchId,
      fromId,
      body,
      sentAt: new Date().toISOString(),
    };
    await this.pool.query(
      `INSERT INTO messages (message_id, match_id, from_id, body, sent_at)
       VALUES ($1, $2, $3, $4, $5::timestamptz)`,
      [message.messageId, matchId, fromId, body, message.sentAt],
    );
    return message;
  }

  async listMessages(matchId: string): Promise<ChatMessage[]> {
    await this.ensure();
    const result = await this.pool.query<ChatMessage>(
      `SELECT message_id AS "messageId", match_id AS "matchId", from_id AS "fromId",
              body, sent_at AS "sentAt"
         FROM messages WHERE match_id = $1 ORDER BY sent_at ASC`,
      [matchId],
    );
    return result.rows.map((row) => ({
      ...row,
      sentAt: new Date(row.sentAt).toISOString(),
    }));
  }

  async recordBlock(fromId: string, toId: string): Promise<void> {
    await this.ensure();
    await this.pool.query(
      `INSERT INTO blocks (from_id, to_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [fromId, toId],
    );
  }

  async isBlocked(aId: string, bId: string): Promise<boolean> {
    await this.ensure();
    const result = await this.pool.query(
      `SELECT 1 FROM blocks WHERE (from_id = $1 AND to_id = $2) OR (from_id = $2 AND to_id = $1)`,
      [aId, bId],
    );
    return Boolean(result.rows[0]);
  }

  async recordReport(reporterId: string, subjectId: string, reason: string): Promise<SafetyReport> {
    await this.ensure();
    const report: SafetyReport = {
      reportId: crypto.randomUUID(),
      reporterId,
      subjectId,
      reason,
    };
    await this.pool.query(
      `INSERT INTO reports (report_id, reporter_id, subject_id, reason, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [report.reportId, reporterId, subjectId, reason],
    );
    return report;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
