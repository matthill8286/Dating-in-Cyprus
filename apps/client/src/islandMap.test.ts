import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { mapShouldHandleWheel } from './map';

const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'IslandMap.tsx'), 'utf8');

describe('island map chrome', () => {
  it('keeps the peek strip outside the pan surface so the row can scroll', () => {
    const pan = src.indexOf('{...camera.pan.panHandlers}');
    const peek = src.indexOf('<PeekStrip');
    const board = src.lastIndexOf('<View', pan);
    expect(pan).toBeGreaterThan(-1);
    expect(peek).toBeGreaterThan(pan);
    expect(netOpenViews(src.slice(board, peek))).toBeLessThanOrEqual(0);
  });

  it('zooms from the wheel in small steps instead of jumping a level per tick', () => {
    expect(src).toContain('zoomDeltaFromWheel');
    expect(src).not.toContain('event.deltaY < 0 ? 1 : -1');
  });

  it('lets the peek strip keep wheel and trackpad scroll', () => {
    const host = { contains: (node: unknown) => node === 'pin' };
    expect(mapShouldHandleWheel('pin', host)).toBe(true);
    expect(mapShouldHandleWheel('peek-card', host)).toBe(false);
    expect(mapShouldHandleWheel(null, host)).toBe(false);
  });
});

function netOpenViews(chunk: string): number {
  return [...chunk.matchAll(/<View[\s>]/g)].length - [...chunk.matchAll(/<\/View>/g)].length;
}
