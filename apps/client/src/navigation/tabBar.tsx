import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, View } from 'react-native';
import { color } from '../theme';
import { TabBar, type MainTab, type TabGo } from '../ui/tabs';
import { tabBarIsHidden } from './tabVisibility';
import { TAB_ROUTE } from './types';

export function MainTabBar({ state, descriptors, navigation, insets }: BottomTabBarProps) {
  const focused = state.routes[state.index];
  const style = StyleSheet.flatten(descriptors[focused.key]?.options.tabBarStyle);
  if (tabBarIsHidden(style)) return null;

  const active = tabFromRouteName(focused.name);
  const go: TabGo = {
    people: () => navigation.navigate(TAB_ROUTE.people),
    matches: () => navigation.navigate(TAB_ROUTE.matches),
    messages: () => navigation.navigate(TAB_ROUTE.messages),
    profile: () => navigation.navigate(TAB_ROUTE.profile),
  };
  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom }]}>
      <TabBar active={active} go={go} />
    </View>
  );
}

function tabFromRouteName(name: string): MainTab {
  const found = (Object.keys(TAB_ROUTE) as MainTab[]).find((tab) => TAB_ROUTE[tab] === name);
  return found ?? 'people';
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: color.paper },
});
