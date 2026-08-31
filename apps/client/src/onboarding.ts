export const ONBOARDING_PHOTOS = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&h=1200&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&h=1200&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=900&h=1200&q=80',
] as const;

export const ONBOARDING_SLIDES = [
  {
    title: 'Here',
    body: 'Dating for people whose primary home is in the Republic of Cyprus. Not a holiday. Not a stopover.',
  },
  {
    title: 'Matches',
    body: 'Here introduces you to one person at a time. When interest is mutual, a Match opens and you can chat.',
  },
  {
    title: 'Free',
    body: 'Join, introductions, Match, and chat are free. Twenty-one and over. Residents only.',
  },
] as const;

export function clampSlide(index: number, count = ONBOARDING_SLIDES.length): number {
  if (count <= 0) return 0;
  return Math.max(0, Math.min(index, count - 1));
}

export function onboardingSwipe(dx: number, threshold = 48): 'next' | 'prev' | null {
  if (dx <= -threshold) return 'next';
  if (dx >= threshold) return 'prev';
  return null;
}
