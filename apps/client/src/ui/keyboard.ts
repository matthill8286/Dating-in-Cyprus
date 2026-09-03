export function keyboardAvoidProps(os: string): {
  behavior: 'padding' | undefined;
  enabled: boolean;
} {
  if (os === 'ios') return { behavior: 'padding', enabled: true };
  return { behavior: undefined, enabled: false };
}
