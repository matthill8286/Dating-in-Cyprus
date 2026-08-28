import { z } from 'zod';

export const healthResponse = z.object({
  status: z.literal('ok'),
});

export const sessionResponse = z.object({
  accountId: z.string(),
});
