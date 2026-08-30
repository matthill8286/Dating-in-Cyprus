export type VendorOutcome = 'passed' | 'failed';

export interface PhotoVerificationVendor {
  check(accountId: string): Promise<VendorOutcome>;
}

export type StubOutcome = VendorOutcome | 'unavailable';

export function stubVendor(outcome: StubOutcome = 'passed'): PhotoVerificationVendor {
  return {
    async check() {
      if (outcome === 'unavailable') {
        throw Object.assign(new Error('Photo verification vendor unavailable'), {
          code: 'photo_verification_unavailable',
        });
      }
      return outcome;
    },
  };
}

export function isVendorDown(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: string }).code === 'photo_verification_unavailable'
  );
}
