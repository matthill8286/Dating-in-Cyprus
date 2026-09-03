import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { inputKeyboard } from './input';

const steps = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '..', 'joinSteps.tsx'), 'utf8');

describe('input keyboards', () => {
  it('opens the number pad for a Cyprus mobile', () => {
    expect(inputKeyboard('phone')).toMatchObject({
      keyboardType: 'number-pad',
      autoComplete: 'tel',
      textContentType: 'telephoneNumber',
    });
    expect(steps).toContain('kind="phone"');
  });

  it('opens the email keyboard and hides a password', () => {
    expect(inputKeyboard('email').keyboardType).toBe('email-address');
    expect(inputKeyboard('password').secureTextEntry).toBe(true);
    expect(inputKeyboard('text').keyboardType).toBe('default');
  });
});
