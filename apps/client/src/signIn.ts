import * as yup from 'yup';
import { storeJoinSession, type JoinResult } from './join';

export type SignInValues = {
  email: string;
  password: string;
};

export const signInSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(8).required(),
});

export function validateSignIn(values: SignInValues): 'ok' | 'invalid' {
  try {
    signInSchema.validateSync(values);
    return 'ok';
  } catch {
    return 'invalid';
  }
}

export type SignInPostResult = { data?: { token: string }; error?: { code?: string } };

export function signInRefusalMessage(code: string): string {
  if (code === 'invalid') return 'Enter your email and password.';
  if (code === 'unauthenticated') return 'Email or password is wrong.';
  if (code === 'network') {
    return 'Cannot reach Here. Check your phone is on the same Wi‑Fi as your Mac and the API is running.';
  }
  return 'Sign in failed.';
}

export async function completeSignIn(
  values: SignInValues,
  postSessions: (values: SignInValues) => Promise<SignInPostResult>,
  setSessionToken: (token: string | null) => void,
): Promise<JoinResult> {
  if (validateSignIn(values) !== 'ok') {
    return storeJoinSession(setSessionToken, { ok: false, code: 'invalid' });
  }
  const { data, error } = await postSessions(values);
  if (data?.token) {
    return storeJoinSession(setSessionToken, { ok: true, token: data.token });
  }
  return storeJoinSession(setSessionToken, { ok: false, code: error?.code ?? 'error' });
}
