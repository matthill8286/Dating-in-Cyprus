export const OPERATING_AREA_CITIES = [
  'Limassol',
  'Nicosia',
  'Larnaca',
  'Paphos',
  'Paralimni',
  'Ayia Napa',
] as const;

export type OperatingAreaCity = (typeof OPERATING_AREA_CITIES)[number];

export const DATING_INTENT_PATTERN =
  /lookingFor|looking-for|relationshipGoal|relationship-goal|datingIntent|dating-intent/i;

export function hasDatingIntentLabel(value: unknown): boolean {
  return DATING_INTENT_PATTERN.test(JSON.stringify(value));
}
