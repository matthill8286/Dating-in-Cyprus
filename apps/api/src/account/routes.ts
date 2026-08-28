import type { FastifyInstance } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import { createSessionToken } from '../auth/sessionToken';
import type { Config } from '../config';
import { ageInYears, MINIMUM_JOIN_AGE } from './age';
import { apiError, joinRequest, joinResponse, signInRequest } from './contracts';
import { hashPassword, passwordMatches } from './password';
import { AccountConflict, type AccountStore } from './store';

export type AccountRoutesOpts = {
  config: Config;
  accounts: AccountStore;
  now: () => Date;
};

export async function accountRoutes(
  app: FastifyInstance,
  opts: AccountRoutesOpts,
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();

  typed.post(
    '/v1/accounts',
    {
      schema: {
        body: joinRequest,
        response: { 201: joinResponse, 403: apiError, 400: apiError, 409: apiError },
      },
    },
    async (req, reply) => {
      const age = ageInYears(req.body.dateOfBirth, opts.now());
      if (age < MINIMUM_JOIN_AGE) {
        return reply.code(403).send({
          code: 'age_ineligible',
          message: 'You must be 21 or over to join.',
        });
      }
      try {
        const account = await opts.accounts.create({
          email: req.body.email,
          passwordHash: hashPassword(req.body.password),
          dateOfBirth: req.body.dateOfBirth,
          launchLanguage: req.body.launchLanguage,
          gender: req.body.gender,
          seeking: req.body.seeking,
        });
        const token = createSessionToken(opts.config.SESSION_SECRET, account.id);
        return reply.code(201).send({ accountId: account.id, token });
      } catch (err) {
        if (err instanceof AccountConflict) {
          return reply.code(409).send({
            code: 'conflict',
            message: err.message,
          });
        }
        throw err;
      }
    },
  );

  typed.post(
    '/v1/sessions',
    {
      schema: {
        body: signInRequest,
        response: { 200: joinResponse, 401: apiError },
      },
    },
    async (req, reply) => {
      const account = await opts.accounts.findByEmail(req.body.email);
      if (!account || !passwordMatches(req.body.password, account.passwordHash)) {
        return reply.code(401).send({
          code: 'unauthenticated',
          message: 'Email or password is wrong.',
        });
      }
      const token = createSessionToken(opts.config.SESSION_SECRET, account.id);
      return { accountId: account.id, token };
    },
  );
}
