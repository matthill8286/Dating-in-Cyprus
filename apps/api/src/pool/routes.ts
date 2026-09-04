import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { apiError } from '../account/contracts';
import type { LoopDeps } from '../match/actions';
import { listPageQuery, poolResponse, slicePage } from './contracts';
import { listVisibleProfiles } from './visible';

export async function poolRoutes(app: FastifyInstance, opts: LoopDeps): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.get(
    '/v1/pool',
    {
      schema: {
        querystring: listPageQuery,
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
      const profiles = await listVisibleProfiles(account, opts);
      return {
        admitted: true as const,
        profiles: slicePage(profiles, req.query.limit, req.query.offset ?? 0),
      };
    },
  );
}
