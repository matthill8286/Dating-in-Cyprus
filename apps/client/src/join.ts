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
  mobile: string;
  primaryHomeAttestation: boolean;
  presence: { latitude: number; longitude: number } | null;
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
  mobile: yup
    .string()
    .matches(/^\+3579\d{7}$/)
    .required(),
  primaryHomeAttestation: yup.boolean().oneOf([true]).required(),
  presence: yup
    .object({
      latitude: yup.number().required(),
      longitude: yup.number().required(),
    })
    .required(),
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
  if (code === 'visitor_refused') {
    return 'Only a Resident can join. A Visitor is refused at the gate.';
  }
  if (code === 'invalid') {
    return 'Check the form and try again.';
  }
  return 'Join failed.';
}

const JOIN_FIELD_HINT: Record<string, string> = {
  email: 'Enter a valid email.',
  password: 'Password must be at least 8 characters.',
  dateOfBirth: 'Date of birth must be YYYY-MM-DD.',
  launchLanguage: 'Choose a language.',
  mobile: 'Enter a Cyprus mobile number starting +3579.',
  specialCategoryConsent: 'Confirm matching may use gender and who you want to meet.',
  primaryHomeAttestation: 'Confirm your primary home is in the Republic of Cyprus.',
  presence: 'Confirm you are in the Republic of Cyprus now.',
};

export function joinInvalidMessage(values: JoinFormValues): string {
  try {
    joinFormSchema.validateSync(values);
    return joinRefusalMessage('invalid');
  } catch (error) {
    if (error instanceof yup.ValidationError && error.path) {
      return JOIN_FIELD_HINT[error.path] ?? joinRefusalMessage('invalid');
    }
    return joinRefusalMessage('invalid');
  }
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
