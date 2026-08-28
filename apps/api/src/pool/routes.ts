import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { apiError } from '../account/contracts';
import { poolResponse } from './contracts';
import type { AccountStore } from '../account/store';

export async function poolRoutes(
  app: FastifyInstance,
  opts: { accounts: AccountStore },
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    '/v1/pool',
    {
      schema: {
        response: { 200: poolResponse, 403: apiError },
      },
    },
    async (req, reply) => {
      const account = req.accountId ? await opts.accounts.findById(req.accountId) : null;
      if (!account?.residentAdmitted) {
        return reply.code(403).send({
          code: 'visitor_refused',
          message: 'Only a Resident can use the Pool.',
        });
      }
      return { admitted: true as const };
    },
  );
}
