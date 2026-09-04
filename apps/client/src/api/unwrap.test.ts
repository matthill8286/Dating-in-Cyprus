import { describe, expect, it } from 'vitest';
import { ApiError, isUnauthorized, shouldRetry, unwrap } from './unwrap';

function result<T>(status: number, body: { data?: T; error?: unknown }) {
  return { ...body, response: { status } as Response };
}

describe('api unwrap', () => {
  it('returns the body and throws the server refusal otherwise', () => {
    expect(unwrap(result(200, { data: { ok: true } }))).toEqual({ ok: true });
    expect(() => unwrap(result(403, { error: { message: 'Only a Resident can use the Pool.' } }))).toThrow(
      'Only a Resident can use the Pool.',
    );
    expect(() => unwrap(result(500, {}))).toThrow('Request failed with 500.');
  });

  it('recognises an expired session so the app can sign out once, centrally', () => {
    expect(isUnauthorized(new ApiError(401, 'no'))).toBe(true);
    expect(isUnauthorized(new ApiError(403, 'no'))).toBe(false);
    expect(isUnauthorized(new Error('offline'))).toBe(false);
  });

  it('retries transport faults and 5xx once, but never a refusal', () => {
    expect(shouldRetry(0, new Error('network'))).toBe(true);
    expect(shouldRetry(0, new ApiError(503, 'down'))).toBe(true);
    expect(shouldRetry(0, new ApiError(404, 'gone'))).toBe(false);
    expect(shouldRetry(0, new ApiError(401, 'expired'))).toBe(false);
    expect(shouldRetry(1, new Error('network'))).toBe(false);
  });
});
