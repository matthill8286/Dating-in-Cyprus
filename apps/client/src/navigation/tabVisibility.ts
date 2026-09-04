import { TAB_ROOT_SCREEN, type MainTabParamList } from './types';

export function focusedRouteName(route: {
  state?: { routes: Array<{ name: string }>; index?: number };
}): string | undefined {
  if (!route.state?.routes?.length) return undefined;
  const index = route.state.index ?? route.state.routes.length - 1;
  return route.state.routes[index]?.name;
}

export function hideTabBarOnPush(route: {
  name: string;
  state?: { routes: Array<{ name: string }>; index?: number };
}): boolean {
  const tab = route.name as keyof MainTabParamList;
  const root = TAB_ROOT_SCREEN[tab];
  const focused = focusedRouteName(route) ?? root;
  return focused === root;
}
