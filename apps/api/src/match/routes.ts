import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { apiError } from '../account/contracts';
import {
  chatMessageResponse,
  interestResponse,
  matchDetailResponse,
  matchListQuery,
  matchListResponse,
  messageBody,
  messageListQuery,
  messageListResponse,
  passResponse,
  profileIdBody,
  reportBody,
  reportResponse,
  blockResponse,
} from './contracts';
import {
  expressInterest,
  listChat,
  listOwnMatches,
  readMatch,
  recordPass,
  sendChat,
  unmatchPair,
  type LoopDeps,
} from './actions';
import { slicePage } from '../pool/contracts';
import { fileBlock, fileReport } from './safety';

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
    { schema: { querystring: matchListQuery, response: { 200: matchListResponse, 403: apiError } } },
    async (req, reply) => {
      const body = await listOwnMatches(req.accountId, reply, opts);
      if (!body) return;
      return { matches: slicePage(body.matches, req.query.limit, req.query.offset ?? 0) };
    },
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

  typed.delete(
    '/v1/matches/:matchId',
    {
      schema: {
        params: matchIdParam,
        response: { 200: passResponse, 403: apiError, 404: apiError },
      },
    },
    async (req, reply) => unmatchPair(req.accountId, req.params.matchId, reply, opts),
  );

  typed.get(
    '/v1/matches/:matchId/messages',
    {
      schema: {
        params: matchIdParam,
        querystring: messageListQuery,
        response: { 200: messageListResponse, 403: apiError, 404: apiError },
      },
    },
    async (req, reply) =>
      listChat(
        req.accountId,
        req.params.matchId,
        { limit: req.query.limit, before: req.query.before },
        reply,
        opts,
      ),
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

  typed.post(
    '/v1/blocks',
    {
      schema: {
        body: profileIdBody,
        response: { 200: blockResponse, 403: apiError },
      },
    },
    async (req, reply) => fileBlock(req.accountId, req.body.profileId, reply, opts),
  );

  typed.post(
    '/v1/reports',
    {
      schema: {
        body: reportBody,
        response: { 200: reportResponse, 403: apiError },
      },
    },
    async (req, reply) => fileReport(req.accountId, req.body.profileId, req.body.reason, reply, opts),
  );
}
