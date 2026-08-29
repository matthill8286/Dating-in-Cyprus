import { describe, expect, it } from 'vitest';
import { hasDatingIntentLabel } from './profile';
import {
  clampSlide,
  ONBOARDING_PHOTOS,
  ONBOARDING_SLIDES,
  onboardingSwipe,
} from './onboarding';

describe('onboarding slides', () => {
  it('has three slides with photos and no paywall or dating-intent label', () => {
    expect(ONBOARDING_SLIDES).toHaveLength(3);
    expect(ONBOARDING_PHOTOS).toHaveLength(3);
    expect(ONBOARDING_SLIDES.map((slide) => slide.title)).toEqual(['Here', 'Matches', 'Free']);
    expect(hasDatingIntentLabel(ONBOARDING_SLIDES)).toBe(false);
    const copy = JSON.stringify(ONBOARDING_SLIDES);
    expect(copy).not.toMatch(/premium|subscribe|paywall|algorithm|bot/i);
  });

  it('clamps the index and swipes left to the next slide', () => {
    expect(clampSlide(-1)).toBe(0);
    expect(clampSlide(9)).toBe(2);
    expect(onboardingSwipe(-80)).toBe('next');
    expect(onboardingSwipe(80)).toBe('prev');
    expect(onboardingSwipe(10)).toBeNull();
  });
});
