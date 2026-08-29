import { z } from 'zod';
import { profileResponse } from '../profile/contracts';

export const profileIdBody = z.object({
  profileId: z.string().min(1),
});

export const interestResponse = z.object({
  matched: z.boolean(),
  matchId: z.string().optional(),
});

export const matchListResponse = z.object({
  matches: z.array(
    z.object({
      matchId: z.string(),
      profile: profileResponse,
    }),
  ),
});

export const messageBody = z.object({
  body: z.string().min(1).max(2000),
});

export const passResponse = z.object({
  ok: z.literal(true),
});

export const matchDetailResponse = z.object({
  matchId: z.string(),
  profile: profileResponse,
});

export const chatMessageResponse = z.object({
  messageId: z.string(),
  matchId: z.string(),
  fromMe: z.boolean(),
  sentAt: z.string(),
  body: z.string(),
});

export const messageListResponse = z.object({
  messages: z.array(chatMessageResponse),
});
