import type { FastifyReply } from 'fastify';
import type { Account } from '../account/store';

export async function requireResident(
  accounts: { findById(id: string): Promise<Account | null> },
  accountId: string | undefined,
  reply: FastifyReply,
): Promise<Account | null> {
  const account = accountId ? await accounts.findById(accountId) : null;
  if (!account?.residentAdmitted) {
    await reply.code(403).send({
      code: 'visitor_refused',
      message: 'Only a Resident can use a Profile.',
    });
    return null;
  }
  return account;
}
