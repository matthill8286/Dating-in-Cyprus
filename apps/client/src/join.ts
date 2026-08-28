import * as yup from 'yup';

export const MINIMUM_JOIN_AGE = 21;
export const LAUNCH_LANGUAGES = ['en', 'uk', 'ru', 'ro', 'bg'] as const;
export const GENDERS = ['man', 'woman'] as const;
export const SEEKING = ['men', 'women'] as const;

export type LaunchLanguage = (typeof LAUNCH_LANGUAGES)[number];
export type Gender = (typeof GENDERS)[number];
export type Seeking = (typeof SEEKING)[number];

export type JoinFormValues = {
  email: string;
  password: string;
  dateOfBirth: string;
  launchLanguage: LaunchLanguage;
  gender: Gender;
  seeking: Seeking;
  specialCategoryConsent: boolean;
};

export function joinAgeStatus(
  dateOfBirth: string,
  now: Date = new Date(),
): 'ok' | 'age_ineligible' {
  const dob = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(dob.getTime())) return 'age_ineligible';
  let age = now.getUTCFullYear() - dob.getUTCFullYear();
  const monthDelta = now.getUTCMonth() - dob.getUTCMonth();
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < dob.getUTCDate())) {
    age -= 1;
  }
  return age >= MINIMUM_JOIN_AGE ? 'ok' : 'age_ineligible';
}

export const joinFormSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
  dateOfBirth: yup
    .string()
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  launchLanguage: yup.string().oneOf(LAUNCH_LANGUAGES).required(),
  gender: yup.string().oneOf(GENDERS).required(),
  seeking: yup.string().oneOf(SEEKING).required(),
  specialCategoryConsent: yup.boolean().oneOf([true]).required(),
});

export function validateJoinForm(
  values: JoinFormValues,
  now: Date = new Date(),
): 'ok' | 'age_ineligible' | 'invalid' {
  if (joinAgeStatus(values.dateOfBirth, now) === 'age_ineligible') return 'age_ineligible';
  try {
    joinFormSchema.validateSync(values);
    return 'ok';
  } catch {
    return 'invalid';
  }
}

export type JoinResult = { ok: true; token: string } | { ok: false; code: string };

export async function storeJoinSession(
  setSessionToken: (token: string | null) => void,
  result: JoinResult,
): Promise<JoinResult> {
  if (result.ok) setSessionToken(result.token);
  return result;
}

export function joinRefusalMessage(code: string): string {
  if (code === 'age_ineligible') return 'You must be 21 or over to join.';
  if (code === 'invalid') return 'Check email, password, Launch language, and consent.';
  return 'Join failed.';
}

export type JoinPostResult = { data?: { token: string }; error?: { code?: string } };

export function joinApiErrorCode(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'code' in error) {
    const code = Reflect.get(error, 'code');
    if (typeof code === 'string') return code;
  }
  return 'error';
}

export async function completeJoin(
  values: JoinFormValues,
  postAccounts: (values: JoinFormValues) => Promise<JoinPostResult>,
  setSessionToken: (token: string | null) => void,
  now: Date = new Date(),
): Promise<JoinResult> {
  const status = validateJoinForm(values, now);
  if (status !== 'ok') {
    return storeJoinSession(setSessionToken, { ok: false, code: status });
  }
  const { data, error } = await postAccounts(values);
  if (data?.token) {
    return storeJoinSession(setSessionToken, { ok: true, token: data.token });
  }
  return storeJoinSession(setSessionToken, { ok: false, code: error?.code ?? 'error' });
}
