import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appJson = JSON.parse(
  readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../app.json'), 'utf8'),
) as { expo: { platforms: string[] } };

describe('platforms', () => {
  it('ships iOS and Android first; web is extra', () => {
    expect(appJson.expo.platforms.slice(0, 2)).toEqual(['ios', 'android']);
    expect(appJson.expo.platforms).toContain('web');
  });
});
