import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { apiError } from '../account/contracts';
import { interestResponse, passResponse } from '../match/contracts';
import { introductionResponse } from './contracts';
import { acceptIntroduction, currentIntroduction, declineIntroduction, type HostDeps } from './propose';

const introductionIdParam = z.object({ introductionId: z.string() });

export async function hostRoutes(app: FastifyInstance, opts: HostDeps): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    '/v1/introductions',
    {
      schema: {
        response: { 200: introductionResponse, 403: apiError },
      },
    },
    async (req, reply) => currentIntroduction(req.accountId, reply, opts),
  );

  typed.post(
    '/v1/introductions/:introductionId/yes',
    {
      schema: {
        params: introductionIdParam,
        response: { 200: interestResponse, 403: apiError, 404: apiError, 410: apiError },
      },
    },
    async (req, reply) => acceptIntroduction(req.accountId, req.params.introductionId, reply, opts),
  );

  typed.post(
    '/v1/introductions/:introductionId/pass',
    {
      schema: {
        params: introductionIdParam,
        response: { 200: passResponse, 403: apiError, 404: apiError, 410: apiError },
      },
    },
    async (req, reply) => declineIntroduction(req.accountId, req.params.introductionId, reply, opts),
  );
}
