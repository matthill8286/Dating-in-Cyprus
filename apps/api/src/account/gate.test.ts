import { describe, expect, it } from 'vitest';
import { evaluateResidentGate, inOperatingArea, isCyprusMobile } from './gate';

describe('isCyprusMobile', () => {
  it('accepts a Republic of Cyprus mobile in E.164', () => {
    expect(isCyprusMobile('+35799123456')).toBe(true);
  });

  it('refuses a number that is not a Cyprus mobile', () => {
    expect(isCyprusMobile('+447700900123')).toBe(false);
    expect(isCyprusMobile('+35722123456')).toBe(false);
  });
});

describe('inOperatingArea', () => {
  it('accepts Limassol in the Republic of Cyprus', () => {
    expect(inOperatingArea({ latitude: 34.685, longitude: 33.038 })).toBe(true);
  });

  it('refuses Kyrenia in Northern Cyprus', () => {
    expect(inOperatingArea({ latitude: 35.341, longitude: 33.319 })).toBe(false);
  });

  it('refuses a point off the island', () => {
    expect(inOperatingArea({ latitude: 37.984, longitude: 23.728 })).toBe(false);
  });
});

describe('evaluateResidentGate', () => {
  const limassol = { latitude: 34.685, longitude: 33.038 };

  it('admits a Cyprus mobile present in the Operating area', () => {
    expect(
      evaluateResidentGate({
        mobile: '+35799123456',
        presence: limassol,
        mobileChecker: { isCyprusMobile },
        presenceChecker: { inOperatingArea },
      }),
    ).toBe('ok');
  });

  it('refuses when the SMS vendor rejects the mobile', () => {
    expect(
      evaluateResidentGate({
        mobile: '+35799123456',
        presence: limassol,
        mobileChecker: { isCyprusMobile: () => false },
        presenceChecker: { inOperatingArea },
      }),
    ).toBe('visitor_refused');
  });

  it('refuses when the geo vendor says the person is not in the Operating area', () => {
    expect(
      evaluateResidentGate({
        mobile: '+35799123456',
        presence: limassol,
        mobileChecker: { isCyprusMobile },
        presenceChecker: { inOperatingArea: () => false },
      }),
    ).toBe('visitor_refused');
  });
});
