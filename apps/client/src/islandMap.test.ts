import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { mapShouldHandleWheel } from './map';
import { hideTabBarOnPush } from './navigation/tabVisibility';
import { TAB_ROOT_SCREEN } from './navigation/types';

const dir = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(dir, 'IslandMap.tsx'), 'utf8');
const host = readFileSync(join(dir, 'HostScreen.tsx'), 'utf8');
const island = readFileSync(join(dir, 'IslandScreen.tsx'), 'utf8');
const app = readFileSync(join(dir, '../App.tsx'), 'utf8');
const stacks = readFileSync(join(dir, 'navigation/stacks.tsx'), 'utf8');

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

  it('opens a profile from the island map instead of swallowing the tap', () => {
    expect(island).toContain("navigation.navigate('Person'");
    expect(island).toContain('shouldLoadMore');
  });

  it('lets the peek strip keep wheel and trackpad scroll', () => {
    const host = { contains: (node: unknown) => node === 'pin' };
    expect(mapShouldHandleWheel('pin', host)).toBe(true);
    expect(mapShouldHandleWheel('peek-card', host)).toBe(false);
    expect(mapShouldHandleWheel(null, host)).toBe(false);
  });
});

describe('navigation', () => {
  it('uses React Navigation instead of tab state in App', () => {
    expect(app).toContain('NavigationContainer');
    expect(app).toContain('<MainTabs />');
    expect(app).not.toContain('setTab(');
    expect(app).not.toContain('setPerson(');
  });

  it('pushes Person on its own screen so Back returns to the island', () => {
    expect(host).not.toContain('<PersonScreen');
    expect(host).toContain("navigation.navigate('Island')");
    expect(stacks).toContain('name="Person"');
    expect(stacks).toContain('navigation.goBack()');
  });

  it('hides the tab bar on pushed stack screens', () => {
    expect(
      hideTabBarOnPush({ name: 'Here', state: { routes: [{ name: 'Island' }] } }),
    ).toBe(false);
    expect(
      hideTabBarOnPush({ name: 'Here', state: { routes: [{ name: 'Host' }] } }),
    ).toBe(true);
    expect(TAB_ROOT_SCREEN.Here).toBe('Host');
  });
});

function netOpenViews(chunk: string): number {
  return [...chunk.matchAll(/<View[\s>]/g)].length - [...chunk.matchAll(/<\/View>/g)].length;
}
