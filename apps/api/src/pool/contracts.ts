import { z } from 'zod';
import { profileResponse } from '../profile/contracts';

export const listPageQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export function slicePage<T>(items: T[], limit?: number, offset = 0): T[] {
  if (limit == null) return items.slice(offset);
  return items.slice(offset, offset + limit);
}

export const poolResponse = z.object({
  admitted: z.literal(true),
  profiles: z.array(profileResponse),
});
