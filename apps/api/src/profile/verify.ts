import type { FastifyReply } from 'fastify';
import type { AccountStore } from '../account/store';
import { requireResident } from './resident';
import type { ProfileStore } from './store';
import { isVendorDown, type PhotoVerificationVendor } from './vendor';
import type { PhotoVerificationRecord, PhotoVerificationStore, VerificationStatus } from './verifyStore';

export type VerifyDeps = {
  accounts: AccountStore;
  profiles: ProfileStore;
  verifications: PhotoVerificationStore;
  photoVendor: PhotoVerificationVendor;
  now: () => Date;
};

const notFound = {
  code: 'not_found',
  message: 'Photo verification not found.',
};

const vendorDown = {
  code: 'photo_verification_unavailable',
  message: 'Photo verification is unavailable. Unverified Profiles stay in the Pool.',
};

export async function startPhotoVerification(
  accountId: string | undefined,
  skip: boolean,
  reply: FastifyReply,
  opts: VerifyDeps,
) {
  const viewer = await requireResident(opts.accounts, accountId, reply);
  if (!viewer) return;
  const profile = await opts.profiles.findByAccountId(viewer.id);
  if (!profile) {
    await reply.code(404).send({ code: 'not_found', message: 'Profile not found.' });
    return;
  }
  if (skip) {
    return presentRecord(await persist(viewer.id, 'skipped', opts), 'unverified');
  }
  try {
    const outcome = await opts.photoVendor.check(viewer.id);
    const mark = outcome === 'passed' ? 'verified' : 'unverified';
    if (outcome === 'passed') {
      await opts.profiles.setPhotoVerification(viewer.id, 'verified', opts.now());
    }
    return presentRecord(await persist(viewer.id, outcome, opts), mark);
  } catch (error) {
    if (isVendorDown(error)) {
      await reply.code(502).send(vendorDown);
      return;
    }
    throw error;
  }
}

export async function readPhotoVerification(
  photoVerificationId: string,
  accountId: string | undefined,
  reply: FastifyReply,
  opts: VerifyDeps,
) {
  const viewer = await requireResident(opts.accounts, accountId, reply);
  if (!viewer) return;
  const record = await opts.verifications.findById(photoVerificationId);
  if (!record || record.accountId !== viewer.id) {
    await reply.code(404).send(notFound);
    return;
  }
  const profile = await opts.profiles.findByAccountId(viewer.id);
  return presentRecord(record, profile?.photoVerification ?? 'unverified');
}

async function persist(
  accountId: string,
  status: VerificationStatus,
  opts: VerifyDeps,
): Promise<PhotoVerificationRecord> {
  const at = opts.now().toISOString();
  return opts.verifications.create({
    photoVerificationId: crypto.randomUUID(),
    accountId,
    status,
    createdAt: at,
    completedAt: at,
  });
}

function presentRecord(record: PhotoVerificationRecord, photoVerification: 'unverified' | 'verified') {
  return {
    photoVerificationId: record.photoVerificationId,
    status: record.status,
    photoVerification,
    completedAt: record.completedAt,
  };
}
