import { randomUUID } from 'node:crypto';
import type { FastifyReply } from 'fastify';
import type { Account } from '../account/store';
import { expressInterest, recordPass, type LoopDeps } from '../match/actions';
import { listVisibleProfiles } from '../pool/visible';
import type { Profile } from '../profile/store';
import { requireResident } from '../profile/resident';
import type { IntroductionBody } from './contracts';
import { chooseWithModel, type HostModelOpts } from './mind';
import { introductionReason, isFresh, meetFraming } from './reason';
import type { IntroductionRecord, IntroStore } from './store';

export type HostDeps = LoopDeps & { intros: IntroStore; hostModel?: HostModelOpts };

const INTRO_MS = 24 * 60 * 60 * 1000;

const missing = {
  code: 'introduction_not_found',
  message: 'That Introduction is no longer open.',
};

type Presented = Awaited<ReturnType<typeof listVisibleProfiles>>[number];

export async function currentIntroduction(
  accountId: string | undefined,
  reply: FastifyReply,
  opts: HostDeps,
) {
  const viewer = await requireResident(opts.accounts, accountId, reply);
  if (!viewer) return;
  const own = await opts.profiles.findByAccountId(viewer.id);
  if (!own) {
    return reply.code(403).send({
      code: 'profile_required',
      message: 'Publish a Profile before asking Here for an Introduction.',
    });
  }
  const visible = await listVisibleProfiles(viewer, opts);
  const want = await opts.intros.lastWant(viewer.id);
  const open = await opts.intros.findOpen(viewer.id);
  const kept = open ? visible.find((person) => person.profileId === open.profileId) : undefined;
  if (open && kept && isFresh(open.expiresAt, opts.now())) {
    return { introduction: presentIntro(open, kept, own, open.want ?? want) };
  }
  const next = await pickNext(visible, own, opts, want);
  if (!next) return { introduction: null };
  const record = await openIntroduction(viewer, next, opts.now, want);
  await opts.intros.save(record);
  return { introduction: presentIntro(record, next, own, want) };
}

export async function requestIntroduction(
  accountId: string | undefined,
  want: string,
  reply: FastifyReply,
  opts: HostDeps,
) {
  const viewer = await requireResident(opts.accounts, accountId, reply);
  if (!viewer) return;
  const own = await opts.profiles.findByAccountId(viewer.id);
  if (!own) {
    return reply.code(403).send({
      code: 'profile_required',
      message: 'Publish a Profile before asking Here for an Introduction.',
    });
  }
  const visible = await listVisibleProfiles(viewer, opts);
  const open = await opts.intros.findOpen(viewer.id);
  if (open) await opts.intros.mark(open.introductionId, 'replaced');
  await opts.intros.rememberWant(viewer.id, want);
  const next = await pickNext(visible, own, opts, want);
  if (!next) return { introduction: null };
  const record = await openIntroduction(viewer, next, opts.now, want);
  await opts.intros.save(record);
  return { introduction: presentIntro(record, next, own, want) };
}

export async function acceptIntroduction(
  accountId: string | undefined,
  introductionId: string,
  reply: FastifyReply,
  opts: HostDeps,
) {
  const opened = await requireOpenIntro(accountId, introductionId, reply, opts);
  if (!opened) return;
  const result = await expressInterest(accountId, opened.profileId, reply, opts);
  if (!result) return;
  await opts.intros.mark(introductionId, 'yes');
  return result;
}

export async function declineIntroduction(
  accountId: string | undefined,
  introductionId: string,
  reply: FastifyReply,
  opts: HostDeps,
) {
  const opened = await requireOpenIntro(accountId, introductionId, reply, opts);
  if (!opened) return;
  const result = await recordPass(accountId, opened.profileId, reply, opts);
  if (!result) return;
  await opts.intros.mark(introductionId, 'passed');
  return result;
}

async function requireOpenIntro(
  accountId: string | undefined,
  introductionId: string,
  reply: FastifyReply,
  opts: HostDeps,
) {
  const viewer = await requireResident(opts.accounts, accountId, reply);
  if (!viewer) return null;
  const record = await opts.intros.findById(introductionId);
  if (!record || record.viewerId !== viewer.id || record.status !== 'open') {
    await reply.code(404).send(missing);
    return null;
  }
  if (!isFresh(record.expiresAt, opts.now())) {
    await reply.code(410).send({
      code: 'introduction_expired',
      message: 'This introduction has expired.',
    });
    return null;
  }
  return record;
}

async function openIntroduction(
  viewer: Account,
  person: Presented,
  now: () => Date,
  want?: string,
): Promise<IntroductionRecord> {
  const created = now();
  return {
    introductionId: randomUUID(),
    viewerId: viewer.id,
    profileId: person.profileId,
    accountId: person.accountId,
    createdAt: created.toISOString(),
    expiresAt: new Date(created.getTime() + INTRO_MS).toISOString(),
    status: 'open',
    want,
  };
}

function presentIntro(
  record: IntroductionRecord,
  person: Presented,
  own: Profile,
  want?: string,
): IntroductionBody {
  return {
    introductionId: record.introductionId,
    profileId: person.profileId,
    firstName: person.firstName,
    city: person.city,
    languagesSpoken: person.languagesSpoken,
    photoVerification: person.photoVerification,
    reason: introductionReason(own, person, want),
    meetFraming: meetFraming(person.city),
    portraitUrl: person.photos[0]?.url ?? '',
    bio: person.bio,
    expiresAt: record.expiresAt,
  };
}

function pickNext(visible: Presented[], own: Profile, opts: HostDeps, want?: string) {
  return chooseWithModel(visible, own, want, opts.hostModel);
}
