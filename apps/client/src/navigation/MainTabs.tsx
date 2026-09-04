import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MatchesStack, MessagesStack, PeopleStack } from './stacks';
import { ProfileStack } from './ProfileStack';
import { hideTabBarOnPushFromRoute, MainTabBar } from './tabBar';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function tabScreen({ route }: { route: { name: string; state?: { routes: Array<{ name: string }> } } }): BottomTabNavigationOptions {
  return {
    headerShown: false,
    tabBarStyle: hideTabBarOnPushFromRoute(route) ? undefined : { display: 'none' },
  };
}

export function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <MainTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Here" component={PeopleStack} options={tabScreen} />
      <Tab.Screen name="Matches" component={MatchesStack} options={tabScreen} />
      <Tab.Screen name="Messages" component={MessagesStack} options={tabScreen} />
      <Tab.Screen name="Profile" component={ProfileStack} options={tabScreen} />
    </Tab.Navigator>
  );
}
