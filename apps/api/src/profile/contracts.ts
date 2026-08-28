import { z } from 'zod';
import { LAUNCH_LANGUAGES } from '../account/store';
import { OPERATING_AREA_CITIES } from './model';

export const profileWrite = z.object({
  firstName: z.string().min(1).max(40),
  city: z.enum(OPERATING_AREA_CITIES),
  languagesSpoken: z.array(z.enum(LAUNCH_LANGUAGES)).min(1),
  bio: z.string().min(1).max(280),
  photoIds: z.array(z.string()).max(3).optional(),
});

export const profilePhoto = z.object({
  photoId: z.string(),
  url: z.string(),
});

export const profileResponse = z.object({
  profileId: z.string(),
  accountId: z.string(),
  firstName: z.string(),
  age: z.number().int(),
  city: z.enum(OPERATING_AREA_CITIES),
  languagesSpoken: z.array(z.enum(LAUNCH_LANGUAGES)),
  bio: z.string(),
  photos: z.array(profilePhoto),
});

export const photoUpload = z.object({
  contentType: z.string().min(1),
  data: z.string().min(1),
});
