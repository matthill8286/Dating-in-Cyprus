import { describe, expect, it } from 'vitest';
import { hideTabBarOnPush } from './tabVisibility';
import { TAB_ROOT_SCREEN } from './types';

describe('main tab navigation', () => {
  it('keeps the tab bar on root screens and hides it when a stack pushes', () => {
    for (const tab of Object.keys(TAB_ROOT_SCREEN) as Array<keyof typeof TAB_ROOT_SCREEN>) {
      const root = TAB_ROOT_SCREEN[tab];
      expect(hideTabBarOnPush({ name: tab })).toBe(true);
      expect(hideTabBarOnPush({ name: tab, state: { routes: [{ name: root }] } })).toBe(true);
      expect(hideTabBarOnPush({ name: tab, state: { routes: [{ name: 'Person' }] } })).toBe(false);
    }
  });
});
