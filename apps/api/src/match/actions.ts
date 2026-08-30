import type { FastifyReply } from 'fastify';
import type { AccountStore } from '../account/store';
import { matchingTarget } from '../pool/visible';
import { presentProfile } from '../profile/present';
import { requireResident } from '../profile/resident';
import type { ProfileStore } from '../profile/store';
import type { LoopStore } from './store';
import { isParty, otherParty } from './store';

export type LoopDeps = {
  accounts: AccountStore;
  profiles: ProfileStore;
  loop: LoopStore;
  now: () => Date;
};

const notAllowed = {
  code: 'interest_not_allowed',
  message: 'You can only express Interest in someone in your discovery.',
};

export async function expressInterest(
  accountId: string | undefined,
  profileId: string,
  reply: FastifyReply,
  opts: LoopDeps,
) {
  const viewer = await requireResident(opts.accounts, accountId, reply);
  if (!viewer) return;
  const target = await matchingTarget(viewer, profileId, opts);
  if (!target || (await opts.loop.hasPass(viewer.id, target.account.id))) {
    return reply.code(403).send(notAllowed);
  }
  if (await opts.loop.isBlocked(viewer.id, target.account.id)) {
    return reply.code(403).send(notAllowed);
  }
  await opts.loop.recordInterest(viewer.id, target.account.id);
  const mutual = await opts.loop.hasInterest(target.account.id, viewer.id);
  if (!mutual) return { matched: false as const };
  const { matchId } = await opts.loop.ensureMatch(viewer.id, target.account.id);
  return { matched: true as const, matchId };
}

export async function recordPass(
  accountId: string | undefined,
  profileId: string,
  reply: FastifyReply,
  opts: LoopDeps,
) {
  const viewer = await requireResident(opts.accounts, accountId, reply);
  if (!viewer) return;
  const target = await matchingTarget(viewer, profileId, opts);
  if (!target) return reply.code(403).send(notAllowed);
  if (await opts.loop.hasInterest(viewer.id, target.account.id)) {
    return { ok: true as const };
  }
  await opts.loop.recordPass(viewer.id, target.account.id);
  return { ok: true as const };
}

export async function listOwnMatches(
  accountId: string | undefined,
  reply: FastifyReply,
  opts: LoopDeps,
) {
  const viewer = await requireResident(opts.accounts, accountId, reply);
  if (!viewer) return;
  const records = await opts.loop.listMatches(viewer.id);
  const matches = [];
  for (const record of records) {
    const item = await presentMatch(record.matchId, viewer.id, opts);
    if (item) matches.push(item);
  }
  return { matches };
}

export async function readMatch(
  accountId: string | undefined,
  matchId: string,
  reply: FastifyReply,
  opts: LoopDeps,
) {
  const viewer = await requireResident(opts.accounts, accountId, reply);
  if (!viewer) return;
  const item = await presentMatch(matchId, viewer.id, opts);
  if (!item) return reply.code(404).send({ code: 'not_found', message: 'Match not found.' });
  return item;
}

export async function listChat(
  accountId: string | undefined,
  matchId: string,
  reply: FastifyReply,
  opts: LoopDeps,
) {
  const party = await requireMatchParty(accountId, matchId, reply, opts);
  if (!party) return;
  const rows = await opts.loop.listMessages(matchId);
  return {
    messages: rows.map((row) => ({
      messageId: row.messageId,
      matchId: row.matchId,
      fromMe: row.fromId === party.id,
      sentAt: new Date(row.sentAt).toISOString(),
      body: row.body,
    })),
  };
}

export async function unmatchPair(
  accountId: string | undefined,
  matchId: string,
  reply: FastifyReply,
  opts: LoopDeps,
) {
  const viewer = await requireResident(opts.accounts, accountId, reply);
  if (!viewer) return;
  const match = await opts.loop.findMatch(matchId);
  if (!match || !isParty(match, viewer.id)) {
    return reply.code(404).send({ code: 'not_found', message: 'Match not found.' });
  }
  if (await opts.loop.isBlocked(viewer.id, otherParty(match, viewer.id))) {
    return reply.code(403).send({
      code: 'chat_not_allowed',
      message: 'Chat is not allowed after a Block.',
    });
  }
  await opts.loop.dropMatch(matchId);
  return { ok: true as const };
}

export async function sendChat(
  accountId: string | undefined,
  matchId: string,
  body: string,
  reply: FastifyReply,
  opts: LoopDeps,
) {
  const party = await requireMatchParty(accountId, matchId, reply, opts);
  if (!party) return;
  const row = await opts.loop.addMessage(matchId, party.id, body);
  return {
    messageId: row.messageId,
    matchId: row.matchId,
    fromMe: true as const,
    sentAt: row.sentAt,
    body: row.body,
  };
}

async function requireMatchParty(
  accountId: string | undefined,
  matchId: string,
  reply: FastifyReply,
  opts: LoopDeps,
) {
  const viewer = await requireResident(opts.accounts, accountId, reply);
  if (!viewer) return null;
  const match = await opts.loop.findMatch(matchId);
  if (!match || !isParty(match, viewer.id)) {
    await reply.code(404).send({ code: 'not_found', message: 'Match not found.' });
    return null;
  }
  const otherId = otherParty(match, viewer.id);
  if (await opts.loop.isBlocked(viewer.id, otherId)) {
    await reply.code(403).send({
      code: 'chat_not_allowed',
      message: 'Chat is not allowed after a Block.',
    });
    return null;
  }
  return viewer;
}

async function presentMatch(matchId: string, viewerId: string, opts: LoopDeps) {
  const match = await opts.loop.findMatch(matchId);
  if (!match || !isParty(match, viewerId)) return null;
  const otherId = otherParty(match, viewerId);
  if (await opts.loop.isBlocked(viewerId, otherId)) return null;
  const [account, profile] = await Promise.all([
    opts.accounts.findById(otherId),
    opts.profiles.findByAccountId(otherId),
  ]);
  if (!account || !profile) return null;
  const rows = await opts.loop.listMessages(matchId);
  const last = rows[rows.length - 1];
  return {
    matchId,
    profile: presentProfile(profile, account, opts.now()),
    lastMessage: last
      ? {
          body: last.body,
          fromMe: last.fromId === viewerId,
          sentAt: new Date(last.sentAt).toISOString(),
        }
      : null,
  };
}
