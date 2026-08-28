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
import { poolRoutes } from './pool/routes';

declare module 'fastify' {
  interface FastifyRequest {
    accountId?: string;
  }
}

export interface AppOptions {
  config: Config;
  accounts?: AccountStore;
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
  app.addHook('onClose', async () => {
    await accounts.close();
  });

  await app.register(accountRoutes, {
    config: opts.config,
    accounts,
    now: opts.now ?? (() => new Date()),
    mobileChecker: opts.mobileChecker,
    presenceChecker: opts.presenceChecker,
  });
  await app.register(poolRoutes, { accounts });

  return app;
}
