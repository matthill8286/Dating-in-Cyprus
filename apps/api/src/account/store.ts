export const LAUNCH_LANGUAGES = ['en', 'uk', 'ru', 'ro', 'bg'] as const;
export type LaunchLanguage = (typeof LAUNCH_LANGUAGES)[number];

export const GENDERS = ['man', 'woman'] as const;
export type Gender = (typeof GENDERS)[number];

export const SEEKING = ['men', 'women'] as const;
export type Seeking = (typeof SEEKING)[number];

export type Account = {
  id: string;
  email: string;
  passwordHash: string;
  dateOfBirth: string;
  launchLanguage: LaunchLanguage;
  gender: Gender;
  seeking: Seeking;
  mobile: string;
  residentAdmitted: boolean;
};

export type NewAccount = Omit<Account, 'id'>;

export class AccountConflict extends Error {
  readonly name = 'AccountConflict';

  constructor() {
    super('An Account already exists for that login.');
  }
}

export interface AccountStore {
  create(account: NewAccount): Promise<Account>;
  findByEmail(email: string): Promise<Account | null>;
  findById(id: string): Promise<Account | null>;
  listAdmitted(): Promise<Account[]>;
  close(): Promise<void>;
}

export class MemoryAccountStore implements AccountStore {
  private readonly byEmail = new Map<string, Account>();
  private readonly byId = new Map<string, Account>();

  async create(account: NewAccount): Promise<Account> {
    const existing = this.byEmail.get(account.email.toLowerCase());
    if (existing) throw new AccountConflict();
    const created: Account = { ...account, id: crypto.randomUUID() };
    this.byEmail.set(account.email.toLowerCase(), created);
    this.byId.set(created.id, created);
    return created;
  }

  async findByEmail(email: string): Promise<Account | null> {
    return this.byEmail.get(email.toLowerCase()) ?? null;
  }

  async findById(id: string): Promise<Account | null> {
    return this.byId.get(id) ?? null;
  }

  async listAdmitted(): Promise<Account[]> {
    return [...this.byId.values()].filter((account) => account.residentAdmitted);
  }

  async close(): Promise<void> {
    this.byEmail.clear();
    this.byId.clear();
  }
}
