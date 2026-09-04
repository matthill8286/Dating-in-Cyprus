import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MatchesStack, MessagesStack, PeopleStack } from './stacks';
import { ProfileStack } from './ProfileStack';
import { MainTabBar } from './tabBar';
import { tabBarStyleOnPush } from './tabVisibility';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={MainTabBar}
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: tabBarStyleOnPush(route),
      })}
    >
      <Tab.Screen name="Here" component={PeopleStack} />
      <Tab.Screen name="Matches" component={MatchesStack} />
      <Tab.Screen name="Messages" component={MessagesStack} />
      <Tab.Screen name="Profile" component={ProfileStack} />
    </Tab.Navigator>
  );
}
