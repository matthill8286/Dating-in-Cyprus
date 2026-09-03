import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { keyboardAvoidProps } from './keyboard';

const dir = dirname(fileURLToPath(import.meta.url));
const deck = readFileSync(join(dir, 'deck.tsx'), 'utf8');
const kit = readFileSync(join(dir, 'kit.tsx'), 'utf8');

describe('composer keyboard', () => {
  it('uses KeyboardAvoidingView on iOS instead of measuring the keyboard by hand', () => {
    expect(keyboardAvoidProps('ios')).toEqual({ behavior: 'padding', enabled: true });
    expect(keyboardAvoidProps('android')).toEqual({ behavior: undefined, enabled: false });
    expect(keyboardAvoidProps('web')).toEqual({ behavior: undefined, enabled: false });
    expect(deck).toContain('KeyboardAvoidingView');
    expect(deck).not.toContain('Keyboard.addListener');
  });

  it('lets a form ScrollView inset for the keyboard so Sign in stays reachable', () => {
    expect(kit).toContain('automaticallyAdjustKeyboardInsets');
  });
});
