import { createHmac, timingSafeEqual } from 'node:crypto';

export type SessionClaims = {
  accountId: string;
  exp: number;
};

function sign(secret: string, payload: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createSessionToken(secret: string, accountId: string, ttlSeconds = 1800): string {
  const claims: SessionClaims = { accountId, exp: Date.now() + ttlSeconds * 1000 };
  const payload = Buffer.from(JSON.stringify(claims)).toString('base64url');
  return `${payload}.${sign(secret, payload)}`;
}

export function verifySessionToken(secret: string, token: string): SessionClaims | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, signature] = parts;
  if (!payload || !signature) return null;
  const expected = sign(secret, payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString()) as SessionClaims;
    if (typeof claims.accountId !== 'string' || typeof claims.exp !== 'number') return null;
    if (claims.exp < Date.now()) return null;
    return claims;
  } catch {
    return null;
  }
}

export function bearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return null;
  return token;
}
