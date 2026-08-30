export type VerificationStatus = 'passed' | 'failed' | 'skipped';

export type PhotoVerificationRecord = {
  photoVerificationId: string;
  accountId: string;
  status: VerificationStatus;
  createdAt: string;
  completedAt: string;
};

export interface PhotoVerificationStore {
  create(record: PhotoVerificationRecord): Promise<PhotoVerificationRecord>;
  findById(id: string): Promise<PhotoVerificationRecord | null>;
  close(): Promise<void>;
}

export class MemoryPhotoVerificationStore implements PhotoVerificationStore {
  private readonly byId = new Map<string, PhotoVerificationRecord>();

  async create(record: PhotoVerificationRecord): Promise<PhotoVerificationRecord> {
    this.byId.set(record.photoVerificationId, record);
    return record;
  }

  async findById(id: string): Promise<PhotoVerificationRecord | null> {
    return this.byId.get(id) ?? null;
  }

  async close(): Promise<void> {
    this.byId.clear();
  }
}
