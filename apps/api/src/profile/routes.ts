import type { FastifyInstance, FastifyReply } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { ageInYears } from '../account/age';
import { apiError } from '../account/contracts';
import type { Account } from '../account/store';
import { photoUpload, profilePhoto, profileResponse, profileWrite } from './contracts';
import type { PhotoStore } from './photos';
import { requireResident } from './resident';
import type { Profile, ProfileStore } from './store';

export type ProfileRoutesOpts = {
  accounts: ProfileRoutesOptsAccounts;
  profiles: ProfileStore;
  photos: PhotoStore;
  now: () => Date;
};

type ProfileRoutesOptsAccounts = {
  findById(id: string): Promise<Account | null>;
};

const profileIdParam = z.object({ profileId: z.string() });

const notFound = {
  code: 'not_found',
  message: 'Profile not found.',
};

export async function profileRoutes(
  app: FastifyInstance,
  opts: ProfileRoutesOpts,
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.patch(
    '/v1/profiles/me',
    {
      schema: {
        body: profileWrite,
        response: { 200: profileResponse, 201: profileResponse, 400: apiError, 403: apiError },
      },
    },
    async (req, reply) => saveOwnProfile(req.body, req.accountId, reply, opts),
  );

  typed.get(
    '/v1/profiles/me',
    {
      schema: { response: { 200: profileResponse, 403: apiError, 404: apiError } },
    },
    async (req, reply) => readOwnProfile(req.accountId, reply, opts),
  );

  typed.get(
    '/v1/profiles/:profileId',
    {
      schema: {
        params: profileIdParam,
        response: { 200: profileResponse, 403: apiError, 404: apiError },
      },
    },
    async (req, reply) => readProfile(req.params.profileId, req.accountId, reply, opts),
  );

  typed.post(
    '/v1/profiles/me/photos',
    {
      schema: {
        body: photoUpload,
        response: { 201: profilePhoto, 403: apiError, 400: apiError },
      },
    },
    async (req, reply) => uploadPhoto(req.body, req.accountId, reply, opts),
  );
}

async function saveOwnProfile(
  body: z.infer<typeof profileWrite>,
  accountId: string | undefined,
  reply: FastifyReply,
  opts: ProfileRoutesOpts,
) {
  const account = await requireResident(opts.accounts, accountId, reply);
  if (!account) return;
  const photos = await resolvePhotos(body.photoIds ?? [], opts.photos, reply);
  if (!photos) return;
  const existing = await opts.profiles.findByAccountId(account.id);
  const saved = await opts.profiles.upsert(account.id, {
    firstName: body.firstName,
    city: body.city,
    languagesSpoken: body.languagesSpoken,
    bio: body.bio,
    photos,
  });
  return reply.code(existing ? 200 : 201).send(toResponse(saved, account, opts.now()));
}

async function readOwnProfile(
  accountId: string | undefined,
  reply: FastifyReply,
  opts: ProfileRoutesOpts,
) {
  const account = await requireResident(opts.accounts, accountId, reply);
  if (!account) return;
  const profile = await opts.profiles.findByAccountId(account.id);
  if (!profile) return reply.code(404).send(notFound);
  return toResponse(profile, account, opts.now());
}

async function readProfile(
  profileId: string,
  accountId: string | undefined,
  reply: FastifyReply,
  opts: ProfileRoutesOpts,
) {
  const caller = await requireResident(opts.accounts, accountId, reply);
  if (!caller) return;
  const profile = await opts.profiles.findById(profileId);
  if (!profile) return reply.code(404).send(notFound);
  const owner = await opts.accounts.findById(profile.accountId);
  if (!owner?.residentAdmitted) return reply.code(404).send(notFound);
  return toResponse(profile, owner, opts.now());
}

async function uploadPhoto(
  body: z.infer<typeof photoUpload>,
  accountId: string | undefined,
  reply: FastifyReply,
  opts: ProfileRoutesOpts,
) {
  const account = await requireResident(opts.accounts, accountId, reply);
  if (!account) return;
  const stored = await opts.photos.put({
    bytes: Buffer.from(body.data, 'base64'),
    contentType: body.contentType,
  });
  return reply.code(201).send({ photoId: stored.photoId, url: stored.url });
}

async function resolvePhotos(
  photoIds: string[],
  photos: PhotoStore,
  reply: FastifyReply,
) {
  const resolved = [];
  for (const photoId of photoIds) {
    const stored = await photos.get(photoId);
    if (!stored) {
      await reply.code(400).send({
        code: 'validation_failed',
        message: 'A photo id is not in the EU photo store.',
      });
      return null;
    }
    resolved.push({ photoId: stored.photoId, url: stored.url });
  }
  return resolved;
}

function toResponse(profile: Profile, account: Account, now: Date) {
  return {
    profileId: profile.profileId,
    accountId: profile.accountId,
    firstName: profile.firstName,
    age: ageInYears(account.dateOfBirth, now),
    city: profile.city,
    languagesSpoken: profile.languagesSpoken,
    bio: profile.bio,
    photos: profile.photos,
  };
}
