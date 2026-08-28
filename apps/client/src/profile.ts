import * as yup from 'yup';

export const OPERATING_AREA_CITIES = [
  'Limassol',
  'Nicosia',
  'Larnaca',
  'Paphos',
  'Paralimni',
  'Ayia Napa',
] as const;

export const PROFILE_LANGUAGES = ['en', 'uk', 'ru', 'ro', 'bg'] as const;

export const PROFILE_EDIT_FIELDS = [
  'firstName',
  'city',
  'languagesSpoken',
  'bio',
  'photos',
] as const;

export const DATING_INTENT_PATTERN =
  /lookingFor|looking-for|relationshipGoal|relationship-goal|datingIntent|dating-intent/i;

export type ProfilePhoto = { photoId: string; url: string };

export type Profile = {
  profileId: string;
  accountId: string;
  firstName: string;
  age: number;
  city: (typeof OPERATING_AREA_CITIES)[number];
  languagesSpoken: Array<(typeof PROFILE_LANGUAGES)[number]>;
  bio: string;
  photos: ProfilePhoto[];
};

export type ProfileFormValues = {
  firstName: string;
  city: string;
  languagesSpoken: string[];
  bio: string;
};

export const profileFormSchema = yup.object({
  firstName: yup.string().min(1).max(40).required(),
  city: yup.string().oneOf([...OPERATING_AREA_CITIES]).required(),
  languagesSpoken: yup
    .array()
    .of(yup.string().oneOf([...PROFILE_LANGUAGES]).required())
    .min(1)
    .required(),
  bio: yup.string().min(1).max(280).required(),
});

export function validateProfileForm(values: ProfileFormValues): 'ok' | 'invalid' {
  try {
    profileFormSchema.validateSync(values);
    return 'ok';
  } catch {
    return 'invalid';
  }
}

export function profileViewText(profile: Profile): string {
  const languages = profile.languagesSpoken.join(', ');
  const photos = profile.photos.length ? `${profile.photos.length} photos` : 'No photos yet';
  return [
    profile.firstName,
    String(profile.age),
    profile.city,
    languages,
    profile.bio,
    photos,
  ].join('\n');
}

export function hasDatingIntentLabel(value: unknown): boolean {
  return DATING_INTENT_PATTERN.test(JSON.stringify(value));
}

export function profileEditHasIntentControl(fields: readonly string[]): boolean {
  return fields.some((field) => DATING_INTENT_PATTERN.test(field));
}

export async function saveProfile(
  values: ProfileFormValues,
  patch: (values: ProfileFormValues) => Promise<{ data?: Profile; error?: { code?: string } }>,
  setProfile: (profile: Profile) => void,
): Promise<{ ok: true } | { ok: false; code: string }> {
  if (validateProfileForm(values) !== 'ok') return { ok: false, code: 'invalid' };
  const { data, error } = await patch(values);
  if (data) {
    setProfile(data);
    return { ok: true };
  }
  return { ok: false, code: error?.code ?? 'error' };
}
