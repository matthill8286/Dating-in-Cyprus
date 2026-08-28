import { z } from 'zod';

export const poolResponse = z.object({
  admitted: z.literal(true),
});
