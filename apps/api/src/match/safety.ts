import type { FastifyReply } from 'fastify';
import type { Account } from '../account/store';
import type { Profile } from '../profile/store';
import { requireResident } from '../profile/resident';
import type { LoopDeps } from './actions';
import { REPORT_REASONS } from './contracts';

type ReportReason = (typeof REPORT_REASONS)[number];

const notAllowed = {
  code: 'safety_not_allowed',
  message: 'You can only Block or Report someone else.',
};

export async function fileBlock(
  accountId: string | undefined,
  profileId: string,
  reply: FastifyReply,
  opts: LoopDeps,
) {
  const pair = await otherResident(accountId, profileId, reply, opts);
  if (!pair) return;
  await opts.loop.recordBlock(pair.viewer.id, pair.account.id);
  return { ok: true as const };
}

export async function fileReport(
  accountId: string | undefined,
  profileId: string,
  reason: ReportReason,
  reply: FastifyReply,
  opts: LoopDeps,
) {
  const pair = await otherResident(accountId, profileId, reply, opts);
  if (!pair) return;
  const report = await opts.loop.recordReport(pair.viewer.id, pair.account.id, reason);
  return { reportId: report.reportId, reason };
}

async function otherResident(
  accountId: string | undefined,
  profileId: string,
  reply: FastifyReply,
  opts: LoopDeps,
): Promise<{ viewer: Account; account: Account; profile: Profile } | null> {
  const viewer = await requireResident(opts.accounts, accountId, reply);
  if (!viewer) return null;
  const profile = await opts.profiles.findById(profileId);
  const account = profile ? await opts.accounts.findById(profile.accountId) : null;
  if (!profile || !account || account.id === viewer.id) {
    await reply.code(403).send(notAllowed);
    return null;
  }
  return { viewer, account, profile };
}
