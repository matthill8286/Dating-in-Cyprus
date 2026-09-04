/**
 * `queued` is an Introduction already chosen but not yet shown. Picking the next person
 * costs a model round trip, so it happens while the Resident is still reading the current
 * card rather than after they decide.
 */
export type IntroStatus = 'open' | 'queued' | 'yes' | 'passed' | 'replaced';

export type IntroductionRecord = {
  introductionId: string;
  viewerId: string;
  profileId: string;
  accountId: string;
  createdAt: string;
  expiresAt: string;
  status: IntroStatus;
  want?: string;
};

export interface IntroStore {
  findOpen(viewerId: string): Promise<IntroductionRecord | null>;
  findQueued(viewerId: string): Promise<IntroductionRecord | null>;
  findById(introductionId: string): Promise<IntroductionRecord | null>;
  save(record: IntroductionRecord): Promise<void>;
  mark(introductionId: string, status: IntroStatus): Promise<void>;
  rememberWant(viewerId: string, want: string): Promise<void>;
  lastWant(viewerId: string): Promise<string | undefined>;
  close(): Promise<void>;
}

export class MemoryIntroStore implements IntroStore {
  private readonly byId = new Map<string, IntroductionRecord>();
  private readonly wants = new Map<string, string>();

  async findOpen(viewerId: string): Promise<IntroductionRecord | null> {
    return this.findByStatus(viewerId, 'open');
  }

  async findQueued(viewerId: string): Promise<IntroductionRecord | null> {
    return this.findByStatus(viewerId, 'queued');
  }

  /** Synchronous peek, so a test can wait for the background queue without awaiting it. */
  findQueuedNow(viewerId: string): IntroductionRecord | null {
    return this.findByStatus(viewerId, 'queued');
  }

  private findByStatus(viewerId: string, status: IntroStatus): IntroductionRecord | null {
    for (const record of this.byId.values()) {
      if (record.viewerId === viewerId && record.status === status) return record;
    }
    return null;
  }

  async findById(introductionId: string): Promise<IntroductionRecord | null> {
    return this.byId.get(introductionId) ?? null;
  }

  async save(record: IntroductionRecord): Promise<void> {
    this.byId.set(record.introductionId, record);
  }

  async mark(introductionId: string, status: IntroStatus): Promise<void> {
    const record = this.byId.get(introductionId);
    if (!record) return;
    this.byId.set(introductionId, { ...record, status });
  }

  async rememberWant(viewerId: string, want: string): Promise<void> {
    this.wants.set(viewerId, want);
  }

  async lastWant(viewerId: string): Promise<string | undefined> {
    return this.wants.get(viewerId);
  }

  async close(): Promise<void> {}
}
