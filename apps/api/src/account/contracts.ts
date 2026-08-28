import { z } from 'zod';
import { GENDERS, LAUNCH_LANGUAGES, SEEKING } from './store';

export const joinRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  launchLanguage: z.enum(LAUNCH_LANGUAGES),
  gender: z.enum(GENDERS),
  seeking: z.enum(SEEKING),
  specialCategoryConsent: z.literal(true),
  mobile: z.string().min(8),
  primaryHomeAttestation: z.literal(true),
  presence: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
});

export const signInRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export const joinResponse = z.object({
  accountId: z.string(),
  token: z.string(),
});

export const apiError = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.unknown()).optional(),
});
