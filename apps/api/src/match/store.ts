export type MatchRecord = {
  matchId: string;
  aId: string;
  bId: string;
};

export type ChatMessage = {
  messageId: string;
  matchId: string;
  fromId: string;
  body: string;
  sentAt: string;
};

/** Newest-first window into a thread. `before` is an exclusive `sentAt` cursor. */
export type MessagePage = {
  limit?: number;
  before?: string;
};

export type SafetyReport = {
  reportId: string;
  reporterId: string;
  subjectId: string;
  reason: string;
};

export interface LoopStore {
  recordInterest(fromId: string, toId: string): Promise<boolean>;
  hasInterest(fromId: string, toId: string): Promise<boolean>;
  recordPass(fromId: string, toId: string): Promise<void>;
  hasPass(fromId: string, toId: string): Promise<boolean>;
  hiddenIds(fromId: string): Promise<Set<string>>;
  ensureMatch(aId: string, bId: string): Promise<{ matchId: string; created: boolean }>;
  listMatches(accountId: string): Promise<MatchRecord[]>;
  findMatch(matchId: string): Promise<MatchRecord | null>;
  dropMatch(matchId: string): Promise<MatchRecord | null>;
  addMessage(matchId: string, fromId: string, body: string): Promise<ChatMessage>;
  listMessages(matchId: string, page?: MessagePage): Promise<ChatMessage[]>;
  /** Newest message per match, in one read, for building an inbox without an N+1. */
  lastMessages(matchIds: string[]): Promise<Map<string, ChatMessage>>;
  recordBlock(fromId: string, toId: string): Promise<void>;
  isBlocked(aId: string, bId: string): Promise<boolean>;
  /** Every account blocked in either direction, so an inbox needs one read rather than one per row. */
  blockedIds(accountId: string): Promise<Set<string>>;
  recordReport(reporterId: string, subjectId: string, reason: string): Promise<SafetyReport>;
  close(): Promise<void>;
}

function pairKey(aId: string, bId: string): string {
  return aId < bId ? `${aId}:${bId}` : `${bId}:${aId}`;
}

export class MemoryLoopStore implements LoopStore {
  private readonly interests = new Set<string>();
  private readonly passes = new Set<string>();
  private readonly matches = new Map<string, MatchRecord>();
  private readonly byPair = new Map<string, string>();
  private readonly messages = new Map<string, ChatMessage[]>();
  private readonly blocks = new Set<string>();
  private readonly reports: SafetyReport[] = [];

  async recordInterest(fromId: string, toId: string): Promise<boolean> {
    const key = `${fromId}>${toId}`;
    if (this.interests.has(key)) return false;
    this.interests.add(key);
    return true;
  }

  async hasInterest(fromId: string, toId: string): Promise<boolean> {
    return this.interests.has(`${fromId}>${toId}`);
  }

  async recordPass(fromId: string, toId: string): Promise<void> {
    this.passes.add(`${fromId}>${toId}`);
  }

  async hasPass(fromId: string, toId: string): Promise<boolean> {
    return this.passes.has(`${fromId}>${toId}`);
  }

  async hiddenIds(fromId: string): Promise<Set<string>> {
    const hidden = new Set<string>();
    for (const key of this.interests) {
      if (key.startsWith(`${fromId}>`)) hidden.add(key.slice(fromId.length + 1));
    }
    for (const key of this.passes) {
      if (key.startsWith(`${fromId}>`)) hidden.add(key.slice(fromId.length + 1));
    }
    for (const match of this.matches.values()) {
      if (match.aId === fromId) hidden.add(match.bId);
      if (match.bId === fromId) hidden.add(match.aId);
    }
    for (const key of this.blocks) {
      const [blocker, blocked] = key.split('>');
      if (blocker === fromId && blocked) hidden.add(blocked);
      if (blocked === fromId && blocker) hidden.add(blocker);
    }
    return hidden;
  }

  async ensureMatch(aId: string, bId: string): Promise<{ matchId: string; created: boolean }> {
    const key = pairKey(aId, bId);
    const existing = this.byPair.get(key);
    if (existing) return { matchId: existing, created: false };
    const matchId = crypto.randomUUID();
    const a = aId < bId ? aId : bId;
    const b = aId < bId ? bId : aId;
    this.matches.set(matchId, { matchId, aId: a, bId: b });
    this.byPair.set(key, matchId);
    this.messages.set(matchId, []);
    return { matchId, created: true };
  }

  async listMatches(accountId: string): Promise<MatchRecord[]> {
    return [...this.matches.values()].filter(
      (match) => match.aId === accountId || match.bId === accountId,
    );
  }

  async findMatch(matchId: string): Promise<MatchRecord | null> {
    return this.matches.get(matchId) ?? null;
  }

  async dropMatch(matchId: string): Promise<MatchRecord | null> {
    const match = this.matches.get(matchId);
    if (!match) return null;
    this.matches.delete(matchId);
    this.byPair.delete(pairKey(match.aId, match.bId));
    this.messages.delete(matchId);
    this.interests.delete(`${match.aId}>${match.bId}`);
    this.interests.delete(`${match.bId}>${match.aId}`);
    return match;
  }

  async addMessage(matchId: string, fromId: string, body: string): Promise<ChatMessage> {
    const message: ChatMessage = {
      messageId: crypto.randomUUID(),
      matchId,
      fromId,
      body,
      sentAt: new Date().toISOString(),
    };
    const list = this.messages.get(matchId) ?? [];
    list.push(message);
    this.messages.set(matchId, list);
    return message;
  }

  async listMessages(matchId: string, page?: MessagePage): Promise<ChatMessage[]> {
    const all = [...(this.messages.get(matchId) ?? [])];
    const before = page?.before;
    const older = before ? all.filter((message) => message.sentAt < before) : all;
    if (page?.limit == null) return older;
    return older.slice(Math.max(0, older.length - page.limit));
  }

  async lastMessages(matchIds: string[]): Promise<Map<string, ChatMessage>> {
    const last = new Map<string, ChatMessage>();
    for (const matchId of matchIds) {
      const thread = this.messages.get(matchId);
      const newest = thread?.[thread.length - 1];
      if (newest) last.set(matchId, newest);
    }
    return last;
  }

  async recordBlock(fromId: string, toId: string): Promise<void> {
    this.blocks.add(`${fromId}>${toId}`);
  }

  async isBlocked(aId: string, bId: string): Promise<boolean> {
    return this.blocks.has(`${aId}>${bId}`) || this.blocks.has(`${bId}>${aId}`);
  }

  async blockedIds(accountId: string): Promise<Set<string>> {
    const ids = new Set<string>();
    for (const key of this.blocks) {
      const [from, to] = key.split('>');
      if (from === accountId && to) ids.add(to);
      if (to === accountId && from) ids.add(from);
    }
    return ids;
  }

  async recordReport(reporterId: string, subjectId: string, reason: string): Promise<SafetyReport> {
    const report: SafetyReport = {
      reportId: crypto.randomUUID(),
      reporterId,
      subjectId,
      reason,
    };
    this.reports.push(report);
    return report;
  }

  async close(): Promise<void> {
    this.interests.clear();
    this.passes.clear();
    this.matches.clear();
    this.byPair.clear();
    this.messages.clear();
    this.blocks.clear();
    this.reports.length = 0;
  }
}

export function otherParty(match: MatchRecord, accountId: string): string {
  return match.aId === accountId ? match.bId : match.aId;
}

export function isParty(match: MatchRecord, accountId: string): boolean {
  return match.aId === accountId || match.bId === accountId;
}
