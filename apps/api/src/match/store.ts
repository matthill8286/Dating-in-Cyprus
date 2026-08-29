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

export interface LoopStore {
  recordInterest(fromId: string, toId: string): Promise<boolean>;
  hasInterest(fromId: string, toId: string): Promise<boolean>;
  recordPass(fromId: string, toId: string): Promise<void>;
  hasPass(fromId: string, toId: string): Promise<boolean>;
  hiddenIds(fromId: string): Promise<Set<string>>;
  ensureMatch(aId: string, bId: string): Promise<{ matchId: string; created: boolean }>;
  listMatches(accountId: string): Promise<MatchRecord[]>;
  findMatch(matchId: string): Promise<MatchRecord | null>;
  addMessage(matchId: string, fromId: string, body: string): Promise<ChatMessage>;
  listMessages(matchId: string): Promise<ChatMessage[]>;
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

  async listMessages(matchId: string): Promise<ChatMessage[]> {
    return [...(this.messages.get(matchId) ?? [])];
  }

  async close(): Promise<void> {
    this.interests.clear();
    this.passes.clear();
    this.matches.clear();
    this.byPair.clear();
    this.messages.clear();
  }
}

export function otherParty(match: MatchRecord, accountId: string): string {
  return match.aId === accountId ? match.bId : match.aId;
}

export function isParty(match: MatchRecord, accountId: string): boolean {
  return match.aId === accountId || match.bId === accountId;
}
