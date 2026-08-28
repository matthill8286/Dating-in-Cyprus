import type { FastifyInstance, FastifyReply } from 'fastify';
import type { ZodTypeProvider } from 'fastify-type-provider-zod';
import type { z } from 'zod';
import { createSessionToken } from '../auth/sessionToken';
import type { Config } from '../config';
import { ageInYears, MINIMUM_JOIN_AGE } from './age';
import { apiError, joinRequest, joinResponse, signInRequest } from './contracts';
import {
  defaultMobileChecker,
  defaultPresenceChecker,
  evaluateResidentGate,
  type MobileChecker,
  type PresenceChecker,
} from './gate';
import { hashPassword, passwordMatches } from './password';
import { AccountConflict, type AccountStore } from './store';

export type AccountRoutesOpts = {
  config: Config;
  accounts: AccountStore;
  now: () => Date;
  mobileChecker?: MobileChecker;
  presenceChecker?: PresenceChecker;
};

const visitorRefused = {
  code: 'visitor_refused' as const,
  message: 'Only a Resident can join. A Visitor is refused at the gate.',
};

export async function accountRoutes(
  app: FastifyInstance,
  opts: AccountRoutesOpts,
): Promise<void> {
  const typed = app.withTypeProvider<ZodTypeProvider>();
  const mobileChecker = opts.mobileChecker ?? defaultMobileChecker;
  const presenceChecker = opts.presenceChecker ?? defaultPresenceChecker;

  typed.post(
    '/v1/accounts',
    {
      schema: {
        body: joinRequest,
        response: { 201: joinResponse, 403: apiError, 400: apiError, 409: apiError },
      },
    },
    async (req, reply) => createAccount(req.body, reply, opts, mobileChecker, presenceChecker),
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

async function createAccount(
  body: z.infer<typeof joinRequest>,
  reply: FastifyReply,
  opts: AccountRoutesOpts,
  mobileChecker: MobileChecker,
  presenceChecker: PresenceChecker,
) {
  const age = ageInYears(body.dateOfBirth, opts.now());
  if (age < MINIMUM_JOIN_AGE) {
    return reply.code(403).send({
      code: 'age_ineligible',
      message: 'You must be 21 or over to join.',
    });
  }
  const gate = evaluateResidentGate({
    mobile: body.mobile,
    presence: body.presence,
    mobileChecker,
    presenceChecker,
  });
  if (gate !== 'ok') {
    return reply.code(403).send(visitorRefused);
  }
  try {
    const account = await opts.accounts.create({
      email: body.email,
      passwordHash: hashPassword(body.password),
      dateOfBirth: body.dateOfBirth,
      launchLanguage: body.launchLanguage,
      gender: body.gender,
      seeking: body.seeking,
      mobile: body.mobile,
      residentAdmitted: true,
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
}
