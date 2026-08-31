import { z } from 'zod';
import { LAUNCH_LANGUAGES } from '../account/store';
import { PHOTO_VERIFICATION_MARKS } from '../profile/contracts';
import { OPERATING_AREA_CITIES } from '../profile/model';

export const introduction = z.object({
  introductionId: z.string(),
  profileId: z.string(),
  firstName: z.string(),
  city: z.enum(OPERATING_AREA_CITIES),
  languagesSpoken: z.array(z.enum(LAUNCH_LANGUAGES)),
  photoVerification: z.enum(PHOTO_VERIFICATION_MARKS),
  reason: z.string(),
  meetFraming: z.string(),
  portraitUrl: z.string(),
  bio: z.string(),
  expiresAt: z.string(),
});

export const introductionResponse = z.object({
  introduction: introduction.nullable(),
});

export type IntroductionBody = z.infer<typeof introduction>;
