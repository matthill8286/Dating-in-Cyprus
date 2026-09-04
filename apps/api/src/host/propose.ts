import { randomUUID } from 'node:crypto';
import type { FastifyReply } from 'fastify';
import type { Account } from '../account/store';
import { expressInterest, recordPass, type LoopDeps } from '../match/actions';
import { listVisibleProfiles, visibleProfile } from '../pool/visible';
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
  const live = await liveIntroduction(viewer, opts);
  if (live) {
    const kept = await visibleProfile(viewer, live.profileId, opts);
    if (kept) {
      const held = live.want ?? (await opts.intros.lastWant(viewer.id));
      queueAhead(viewer, own, live, opts);
      return { introduction: presentIntro(live, kept, own, held) };
    }
    // The person is gone since we chose them, so this record is spent.
    await opts.intros.mark(live.introductionId, 'replaced');
  }
  const want = await opts.intros.lastWant(viewer.id);
  const visible = await listVisibleProfiles(viewer, opts);
  const next = await pickNext(visible, own, opts, want);
  if (!next) return { introduction: null };
  const record = await openIntroduction(viewer, next, opts.now, want, 'open');
  await opts.intros.save(record);
  queueAhead(viewer, own, record, opts);
  return { introduction: presentIntro(record, next, own, want) };
}

/**
 * The Introduction to show now: whichever is already open, or the one queued behind it
 * promoted in place. Promotion is what makes Yes and Not this feel instant.
 */
async function liveIntroduction(
  viewer: Account,
  opts: HostDeps,
): Promise<IntroductionRecord | null> {
  const open = await opts.intros.findOpen(viewer.id);
  if (open && isFresh(open.expiresAt, opts.now())) return open;
  const queued = await opts.intros.findQueued(viewer.id);
  if (!queued || !isFresh(queued.expiresAt, opts.now())) return null;
  await opts.intros.mark(queued.introductionId, 'open');
  return { ...queued, status: 'open' };
}

/**
 * Choose the person after this one now, in the background, so the model round trip is spent
 * while the Resident is reading rather than after they decide. Failure is not worth
 * reporting: the next request simply falls back to choosing on demand.
 */
function queueAhead(
  viewer: Account,
  own: Profile,
  showing: IntroductionRecord,
  opts: HostDeps,
): void {
  void (async () => {
    const queued = await opts.intros.findQueued(viewer.id);
    if (queued) return;
    const want = showing.want ?? (await opts.intros.lastWant(viewer.id));
    const visible = await listVisibleProfiles(viewer, opts);
    const candidates = visible.filter((person) => person.profileId !== showing.profileId);
    const next = await pickNext(candidates, own, opts, want);
    if (!next) return;
    // Another request may have queued someone while the model was thinking.
    if (await opts.intros.findQueued(viewer.id)) return;
    await opts.intros.save(await openIntroduction(viewer, next, opts.now, want, 'queued'));
  })().catch(() => undefined);
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
  // Anyone queued was chosen for the previous want, so they no longer answer the question.
  const stale = await opts.intros.findQueued(viewer.id);
  if (stale) await opts.intros.mark(stale.introductionId, 'replaced');
  await opts.intros.rememberWant(viewer.id, want);
  const next = await pickNext(visible, own, opts, want);
  if (!next) return { introduction: null };
  const record = await openIntroduction(viewer, next, opts.now, want, 'open');
  await opts.intros.save(record);
  queueAhead(viewer, own, record, opts);
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
  want: string | undefined,
  status: 'open' | 'queued',
): Promise<IntroductionRecord> {
  const created = now();
  return {
    introductionId: randomUUID(),
    viewerId: viewer.id,
    profileId: person.profileId,
    accountId: person.accountId,
    createdAt: created.toISOString(),
    expiresAt: new Date(created.getTime() + INTRO_MS).toISOString(),
    status,
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
