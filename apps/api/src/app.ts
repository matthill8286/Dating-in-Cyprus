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

declare module 'fastify' {
  interface FastifyRequest {
    accountId?: string;
  }
}

export interface AppOptions {
  config: Config;
}

function isPublicPath(url: string): boolean {
  const path = url.split('?')[0] ?? url;
  return path === '/health' || path.startsWith('/documentation') || path === '/openapi.json';
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

  return app;
}
