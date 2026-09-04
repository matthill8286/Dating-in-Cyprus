import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { hideTabBarOnPush, tabBarIsHidden, tabBarStyleOnPush } from './tabVisibility';
import { TAB_ROOT_SCREEN, TAB_ROUTE } from './types';

const dir = dirname(fileURLToPath(import.meta.url));
const stacks = readFileSync(join(dir, 'stacks.tsx'), 'utf8');
const tabs = readFileSync(join(dir, 'MainTabs.tsx'), 'utf8');
const bar = readFileSync(join(dir, 'tabBar.tsx'), 'utf8');

describe('main tab navigation', () => {
  it('keeps Here, Matches, Messages, and Profile as tabs', () => {
    expect(TAB_ROUTE.people).toBe('Here');
    expect(TAB_ROUTE.matches).toBe('Matches');
    expect(TAB_ROUTE.messages).toBe('Messages');
    expect(TAB_ROUTE.profile).toBe('Profile');
    expect(tabs).toContain('name="Here"');
    expect(tabs).toContain('name="Matches"');
    expect(tabs).toContain('name="Messages"');
    expect(tabs).toContain('name="Profile"');
  });

  it('stacks Island and Person under Here so Back pops to the map', () => {
    expect(TAB_ROOT_SCREEN.Here).toBe('Host');
    expect(stacks).toContain('name="Host"');
    expect(stacks).toContain('name="Island"');
    expect(stacks).toContain('name="Person"');
    expect(bar).toContain('return null');
  });

  it('keeps the tab bar on root screens and hides it when a stack pushes', () => {
    for (const tab of Object.keys(TAB_ROOT_SCREEN) as Array<keyof typeof TAB_ROOT_SCREEN>) {
      const root = TAB_ROOT_SCREEN[tab];
      expect(hideTabBarOnPush({ name: tab })).toBe(true);
      expect(hideTabBarOnPush({ name: tab, state: { routes: [{ name: root }] } })).toBe(true);
      expect(hideTabBarOnPush({ name: tab, state: { routes: [{ name: 'Person' }] } })).toBe(false);
      expect(tabBarStyleOnPush({ name: tab })).toBeUndefined();
      expect(tabBarStyleOnPush({ name: tab, state: { routes: [{ name: 'Person' }] } })).toEqual({
        display: 'none',
      });
    }
  });

  it('hides the tab bar from a nested screen param before the stack has state', () => {
    expect(hideTabBarOnPush({ name: 'Here', params: { screen: 'Island' } })).toBe(false);
    expect(tabBarStyleOnPush({ name: 'Here', params: { screen: 'Island' } })).toEqual({
      display: 'none',
    });
  });

  it('treats display none as a hidden custom tab bar', () => {
    expect(tabBarIsHidden(undefined)).toBe(false);
    expect(tabBarIsHidden({ display: 'flex' })).toBe(false);
    expect(tabBarIsHidden({ display: 'none' })).toBe(true);
  });
});
