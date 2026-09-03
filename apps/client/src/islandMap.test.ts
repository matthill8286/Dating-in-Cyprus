import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { mapShouldHandleWheel } from './map';

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, 'IslandMap.tsx'), 'utf8');
const host = readFileSync(join(dir, 'HostScreen.tsx'), 'utf8');

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

  it('pinches the board on a phone, not only the wheel and zoom pad', () => {
    expect(src).toContain('pinchZoomDelta');
    expect(src).toContain('numberActiveTouches');
  });

  it('opens a Profile from View on the island instead of swallowing the tap', () => {
    expect(host).not.toContain('onOpen={() => undefined}');
    expect(host).toContain('onOpen={onOpen}');
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
