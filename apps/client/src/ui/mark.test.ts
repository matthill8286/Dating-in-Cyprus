import { describe, expect, it } from 'vitest';
import { asText } from './mark';
import { TABS } from './tabMarks';

const FACE = /[\u263A\u2639\u{1F600}-\u{1F64F}\u{1F1E6}-\u{1F1FF}]/u;

describe('asText', () => {
  it('pins a variation selector so iOS cannot swap the glyph for emoji', () => {
    expect(asText('♥')).toBe('♥\uFE0E');
    expect(asText('♥\uFE0E')).toBe('♥\uFE0E');
  });
});

describe('tab marks', () => {
  it('uses text-presentation geometry, never a face or a flag', () => {
    for (const tab of TABS) {
      expect(tab.icon).toContain('\uFE0E');
      expect(tab.iconOn).toContain('\uFE0E');
      expect(tab.icon).not.toMatch(FACE);
      expect(tab.iconOn).not.toMatch(FACE);
    }
  });
});
