import { describe, expect, it } from 'vitest';
import { photoVerificationLabel, photoVerificationOf } from './verify';

describe('Photo verification mark', () => {
  it('shows Unverified by default and Photo verified after a pass', () => {
    expect(photoVerificationOf({})).toBe('unverified');
    expect(photoVerificationOf({ photoVerification: 'unverified' })).toBe('unverified');
    expect(photoVerificationOf({ photoVerification: 'verified' })).toBe('verified');
    expect(photoVerificationLabel('unverified')).toBe('Unverified');
    expect(photoVerificationLabel(undefined)).toBe('Unverified');
    expect(photoVerificationLabel('verified')).toBe('Photo verified');
  });
});
