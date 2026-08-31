export type IntroStatus = 'open' | 'yes' | 'passed';

export type IntroductionRecord = {
  introductionId: string;
  viewerId: string;
  profileId: string;
  accountId: string;
  createdAt: string;
  expiresAt: string;
  status: IntroStatus;
};

export interface IntroStore {
  findOpen(viewerId: string): Promise<IntroductionRecord | null>;
  findById(introductionId: string): Promise<IntroductionRecord | null>;
  save(record: IntroductionRecord): Promise<void>;
  mark(introductionId: string, status: Exclude<IntroStatus, 'open'>): Promise<void>;
}

export class MemoryIntroStore implements IntroStore {
  private readonly byId = new Map<string, IntroductionRecord>();

  async findOpen(viewerId: string): Promise<IntroductionRecord | null> {
    for (const record of this.byId.values()) {
      if (record.viewerId === viewerId && record.status === 'open') return record;
    }
    return null;
  }

  async findById(introductionId: string): Promise<IntroductionRecord | null> {
    return this.byId.get(introductionId) ?? null;
  }

  async save(record: IntroductionRecord): Promise<void> {
    this.byId.set(record.introductionId, record);
  }

  async mark(introductionId: string, status: Exclude<IntroStatus, 'open'>): Promise<void> {
    const record = this.byId.get(introductionId);
    if (!record) return;
    this.byId.set(introductionId, { ...record, status });
  }
}
