import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { apiError } from '../account/contracts';
import {
  chatMessageResponse,
  interestResponse,
  matchDetailResponse,
  matchListResponse,
  messageBody,
  messageListResponse,
  passResponse,
  profileIdBody,
} from './contracts';
import {
  expressInterest,
  listChat,
  listOwnMatches,
  readMatch,
  recordPass,
  sendChat,
  type LoopDeps,
} from './actions';

const matchIdParam = z.object({ matchId: z.string() });

export async function matchRoutes(app: FastifyInstance, opts: LoopDeps): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.post(
    '/v1/interests',
    {
      schema: {
        body: profileIdBody,
        response: { 200: interestResponse, 403: apiError },
      },
    },
    async (req, reply) => expressInterest(req.accountId, req.body.profileId, reply, opts),
  );

  typed.post(
    '/v1/passes',
    {
      schema: {
        body: profileIdBody,
        response: { 200: passResponse, 403: apiError },
      },
    },
    async (req, reply) => recordPass(req.accountId, req.body.profileId, reply, opts),
  );

  typed.get(
    '/v1/matches',
    { schema: { response: { 200: matchListResponse, 403: apiError } } },
    async (req, reply) => listOwnMatches(req.accountId, reply, opts),
  );

  typed.get(
    '/v1/matches/:matchId',
    {
      schema: {
        params: matchIdParam,
        response: { 200: matchDetailResponse, 403: apiError, 404: apiError },
      },
    },
    async (req, reply) => readMatch(req.accountId, req.params.matchId, reply, opts),
  );

  typed.get(
    '/v1/matches/:matchId/messages',
    {
      schema: {
        params: matchIdParam,
        response: { 200: messageListResponse, 403: apiError, 404: apiError },
      },
    },
    async (req, reply) => listChat(req.accountId, req.params.matchId, reply, opts),
  );

  typed.post(
    '/v1/matches/:matchId/messages',
    {
      schema: {
        params: matchIdParam,
        body: messageBody,
        response: {
          201: chatMessageResponse,
          403: apiError,
          404: apiError,
        },
      },
    },
    async (req, reply) => {
      const sent = await sendChat(req.accountId, req.params.matchId, req.body.body, reply, opts);
      if (!sent) return;
      return reply.code(201).send(sent);
    },
  );
}
