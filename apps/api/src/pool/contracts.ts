import { z } from 'zod';
import { profileResponse } from '../profile/contracts';

export const poolResponse = z.object({
  admitted: z.literal(true),
  profiles: z.array(profileResponse),
});
