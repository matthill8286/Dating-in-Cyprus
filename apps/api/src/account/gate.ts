export type Presence = {
  latitude: number;
  longitude: number;
};

export interface MobileChecker {
  isCyprusMobile(e164: string): boolean;
}

export interface PresenceChecker {
  inOperatingArea(presence: Presence): boolean;
}

const CYPRUS_MOBILE = /^\+3579\d{7}$/;

export function isCyprusMobile(e164: string): boolean {
  return CYPRUS_MOBILE.test(e164);
}

export function inOperatingArea(presence: Presence): boolean {
  const { latitude: lat, longitude: lon } = presence;
  if (lat < 34.56 || lat > 35.7 || lon < 32.26 || lon > 34.59) return false;
  if (lat >= 35.2) return false;
  if (lat >= 35.12 && lon >= 33.7) return false;
  return true;
}

export const defaultMobileChecker: MobileChecker = { isCyprusMobile };
export const defaultPresenceChecker: PresenceChecker = { inOperatingArea };

export function evaluateResidentGate(input: {
  mobile: string;
  presence: Presence;
  mobileChecker: MobileChecker;
  presenceChecker: PresenceChecker;
}): 'ok' | 'visitor_refused' {
  if (!input.mobileChecker.isCyprusMobile(input.mobile)) return 'visitor_refused';
  if (!input.presenceChecker.inOperatingArea(input.presence)) return 'visitor_refused';
  return 'ok';
}
