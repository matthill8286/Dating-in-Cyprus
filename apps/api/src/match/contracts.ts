import { z } from 'zod';
import { profileResponse } from '../profile/contracts';

export const profileIdBody = z.object({
  profileId: z.string().min(1),
});

export const interestResponse = z.object({
  matched: z.boolean(),
  matchId: z.string().optional(),
});

export const lastMessagePreview = z.object({
  body: z.string(),
  fromMe: z.boolean(),
  sentAt: z.string(),
});

export const matchListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  offset: z.coerce.number().int().min(0).optional(),
});

export const matchListResponse = z.object({
  matches: z.array(
    z.object({
      matchId: z.string(),
      profile: profileResponse,
      lastMessage: lastMessagePreview.nullable(),
    }),
  ),
});

export const messageBody = z.object({
  body: z.string().min(1).max(2000),
});

/** Newest-first window into a thread; `before` is an exclusive `sentAt` cursor for loading older. */
export const messageListQuery = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  before: z.string().datetime().optional(),
});

export const passResponse = z.object({
  ok: z.literal(true),
});

export const matchDetailResponse = z.object({
  matchId: z.string(),
  profile: profileResponse,
  lastMessage: lastMessagePreview.nullable(),
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

export const REPORT_REASONS = ['fake', 'harassment', 'visitor', 'other'] as const;

export const reportBody = z.object({
  profileId: z.string().min(1),
  reason: z.enum(REPORT_REASONS),
});

export const blockResponse = z.object({
  ok: z.literal(true),
});

export const reportResponse = z.object({
  reportId: z.string(),
  reason: z.enum(REPORT_REASONS),
});
