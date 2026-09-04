import { TAB_ROOT_SCREEN, type MainTabParamList } from './types';

export type TabRoute = {
  name: string;
  state?: { routes: Array<{ name: string }>; index?: number };
  params?: { screen?: string };
};

export function focusedRouteName(route: TabRoute): string | undefined {
  if (route.state?.routes?.length) {
    const index = route.state.index ?? route.state.routes.length - 1;
    return route.state.routes[index]?.name;
  }
  return typeof route.params?.screen === 'string' ? route.params.screen : undefined;
}

export function hideTabBarOnPush(route: TabRoute): boolean {
  const tab = route.name as keyof MainTabParamList;
  const root = TAB_ROOT_SCREEN[tab];
  const focused = focusedRouteName(route) ?? root;
  return focused === root;
}

export function tabBarStyleOnPush(route: TabRoute): { display: 'none' } | undefined {
  return hideTabBarOnPush(route) ? undefined : { display: 'none' };
}

export function tabBarIsHidden(style: unknown): boolean {
  if (!style || typeof style !== 'object' || !('display' in style)) return false;
  return style.display === 'none';
}
