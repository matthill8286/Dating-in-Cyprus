import Fastify, { type FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import sensible from '@fastify/sensible';
import swagger from '@fastify/swagger';
import {
  jsonSchemaTransform,
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod';
import type { Config } from './config';
import { healthResponse, sessionResponse } from './contracts/health';
import { loggerRedact } from './logger';
import { bearerToken, verifySessionToken } from './auth/sessionToken';
import { accountRoutes } from './account/routes';
import { MemoryAccountStore, type AccountStore } from './account/store';
import type { MobileChecker, PresenceChecker } from './account/gate';
import { matchRoutes } from './match/routes';
import { MemoryLoopStore, type LoopStore } from './match/store';
import { poolRoutes } from './pool/routes';
import { MemoryProfileStore, type ProfileStore } from './profile/store';
import { MemoryPhotoStore, type PhotoStore } from './profile/photos';
import { profileRoutes } from './profile/routes';
import { MemoryPhotoVerificationStore, type PhotoVerificationStore } from './profile/verifyStore';
import { photoVerificationRoutes } from './profile/verifyRoutes';
import { stubVendor, type PhotoVerificationVendor } from './profile/vendor';
import { hostRoutes } from './host/routes';
import { MemoryIntroStore, type IntroStore } from './host/store';

declare module 'fastify' {
  interface FastifyRequest {
    accountId?: string;
  }
}

export interface AppOptions {
  config: Config;
  accounts?: AccountStore;
  profiles?: ProfileStore;
  photos?: PhotoStore;
  loop?: LoopStore;
  verifications?: PhotoVerificationStore;
  photoVendor?: PhotoVerificationVendor;
  intros?: IntroStore;
  now?: () => Date;
  mobileChecker?: MobileChecker;
  presenceChecker?: PresenceChecker;
}

function isPublicPath(url: string): boolean {
  const path = url.split('?')[0] ?? url;
  return (
    path === '/health' ||
    path.startsWith('/documentation') ||
    path === '/openapi.json' ||
    path === '/v1/accounts' ||
    path === '/v1/sessions'
  );
}

export async function buildApp(opts: AppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger:
      opts.config.NODE_ENV === 'test'
        ? false
        : {
            redact: loggerRedact,
          },
  }).withTypeProvider<ZodTypeProvider>();
  app.setValidatorCompiler(validatorCompiler);
  app.setSerializerCompiler(serializerCompiler);

  await app.register(helmet, {
    contentSecurityPolicy: { directives: { defaultSrc: ["'none'"] } },
  });
  await app.register(cors, { origin: opts.config.CORS_ORIGINS });
  await app.register(sensible);
  await app.register(swagger, {
    openapi: { info: { title: 'cyprus-dating API', version: '1.0.0' }, servers: [{ url: '/' }] },
    transform: jsonSchemaTransform,
  });

  app.addHook('onRequest', async (req, reply) => {
    if (isPublicPath(req.url)) return;
    const token = bearerToken(req.headers.authorization);
    if (!token) {
      return reply.unauthorized();
    }
    const claims = verifySessionToken(opts.config.SESSION_SECRET, token);
    if (!claims) {
      return reply.unauthorized();
    }
    req.accountId = claims.accountId;
  });

  app.get(
    '/health',
    { schema: { response: { 200: healthResponse } } },
    async () => ({ status: 'ok' as const }),
  );

  app.get(
    '/v1/session',
    { schema: { response: { 200: sessionResponse } } },
    async (req) => ({ accountId: req.accountId ?? '' }),
  );

  const accounts = opts.accounts ?? new MemoryAccountStore();
  const profiles = opts.profiles ?? new MemoryProfileStore();
  const photos = opts.photos ?? new MemoryPhotoStore(opts.config.PHOTO_STORE_REGION);
  const loop = opts.loop ?? new MemoryLoopStore();
  const verifications = opts.verifications ?? new MemoryPhotoVerificationStore();
  const photoVendor = opts.photoVendor ?? stubVendor('passed');
  const intros = opts.intros ?? new MemoryIntroStore();
  const now = opts.now ?? (() => new Date());
  app.addHook('onClose', async () => {
    await accounts.close();
    await profiles.close();
    await loop.close();
    await verifications.close();
  });
  await registerRoutes(app, opts, {
    accounts,
    profiles,
    photos,
    loop,
    verifications,
    photoVendor,
    intros,
    now,
  });
  return app;
}

async function registerRoutes(
  app: FastifyInstance,
  opts: AppOptions,
  deps: {
    accounts: AccountStore;
    profiles: ProfileStore;
    photos: PhotoStore;
    loop: LoopStore;
    verifications: PhotoVerificationStore;
    photoVendor: PhotoVerificationVendor;
    intros: IntroStore;
    now: () => Date;
  },
): Promise<void> {
  await app.register(accountRoutes, {
    config: opts.config,
    accounts: deps.accounts,
    now: deps.now,
    mobileChecker: opts.mobileChecker,
    presenceChecker: opts.presenceChecker,
  });
  await app.register(poolRoutes, deps);
  await app.register(profileRoutes, deps);
  await app.register(matchRoutes, deps);
  await app.register(photoVerificationRoutes, deps);
  await app.register(hostRoutes, deps);
}
