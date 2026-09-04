import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { TabBar, type MainTab, type TabGo } from '../ui/tabs';
import { TAB_ROOT_SCREEN, TAB_ROUTE, type MainTabParamList } from './types';

const TAB_ORDER: MainTab[] = ['people', 'matches', 'messages', 'profile'];

export function MainTabBar({ state, navigation }: BottomTabBarProps) {
  const active = TAB_ORDER[state.index] ?? 'people';
  const go: TabGo = {
    people: () => navigation.navigate(TAB_ROUTE.people),
    matches: () => navigation.navigate(TAB_ROUTE.matches),
    messages: () => navigation.navigate(TAB_ROUTE.messages),
    profile: () => navigation.navigate(TAB_ROUTE.profile),
  };
  return <TabBar active={active} go={go} />;
}

export function hideTabBarOnPushFromRoute(route: {
  name: string;
  state?: { routes: Array<{ name: string }>; index?: number };
}): boolean {
  const tab = route.name as keyof MainTabParamList;
  const root = TAB_ROOT_SCREEN[tab];
  const focused = getFocusedRouteNameFromRoute(route) ?? root;
  return focused === root;
}
