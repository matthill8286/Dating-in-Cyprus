import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { createNativeStackNavigator, type NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChatScreen } from '../ChatScreen';
import { HostScreen } from '../HostScreen';
import { IslandScreen } from '../IslandScreen';
import { MatchesScreen } from '../MatchesScreen';
import { MessagesScreen } from '../MessagesScreen';
import { PersonScreen } from '../PersonScreen';
import type { MatchesStackParamList, MessagesStackParamList, PeopleStackParamList } from './types';

const People = createNativeStackNavigator<PeopleStackParamList>();
const Matches = createNativeStackNavigator<MatchesStackParamList>();
const Messages = createNativeStackNavigator<MessagesStackParamList>();

const stackScreen = { headerShown: false } as const;

export function PeopleStack() {
  return (
    <People.Navigator screenOptions={stackScreen}>
      <People.Screen name="Host" component={HostScreen} />
      <People.Screen name="Island" component={IslandScreen} />
      <People.Screen name="Person" component={PeoplePersonRoute} />
    </People.Navigator>
  );
}

export function MatchesStack() {
  return (
    <Matches.Navigator screenOptions={stackScreen}>
      <Matches.Screen name="MatchesList" component={MatchesScreen} />
      <Matches.Screen name="Person" component={MatchesPersonRoute} />
      <Matches.Screen name="Chat" component={MatchesChatRoute} />
    </Matches.Navigator>
  );
}

export function MessagesStack() {
  return (
    <Messages.Navigator screenOptions={stackScreen}>
      <Messages.Screen name="MessagesList" component={MessagesScreen} />
      <Messages.Screen name="Chat" component={MessagesChatRoute} />
      <Messages.Screen name="Person" component={MessagesPersonRoute} />
    </Messages.Navigator>
  );
}

function PeoplePersonRoute() {
  const route = useRoute<RouteProp<PeopleStackParamList, 'Person'>>();
  const navigation = useNavigation<NativeStackNavigationProp<PeopleStackParamList>>();
  const { profile, matchId } = route.params;
  return (
    <PersonScreen
      profile={profile}
      matchId={matchId}
      onBack={() => navigation.goBack()}
      onBlocked={() => navigation.popToTop()}
      onUnmatched={() => navigation.popToTop()}
    />
  );
}

function MatchesPersonRoute() {
  const route = useRoute<RouteProp<MatchesStackParamList, 'Person'>>();
  const navigation = useNavigation<NativeStackNavigationProp<MatchesStackParamList>>();
  const { profile, matchId } = route.params;
  return (
    <PersonScreen
      profile={profile}
      matchId={matchId}
      onBack={() => navigation.goBack()}
      onMessage={() => navigation.navigate('Chat', { matchId, profile })}
      onBlocked={() => navigation.popToTop()}
      onUnmatched={() => navigation.popToTop()}
    />
  );
}

function MatchesChatRoute() {
  const route = useRoute<RouteProp<MatchesStackParamList, 'Chat'>>();
  const navigation = useNavigation<NativeStackNavigationProp<MatchesStackParamList>>();
  const { matchId, profile } = route.params;
  return (
    <ChatScreen
      match={{ matchId, profile }}
      onBack={() => navigation.goBack()}
      onProfile={() => navigation.navigate('Person', { matchId, profile })}
      onBlocked={() => navigation.popToTop()}
      onUnmatched={() => navigation.popToTop()}
    />
  );
}

function MessagesChatRoute() {
  const route = useRoute<RouteProp<MessagesStackParamList, 'Chat'>>();
  const navigation = useNavigation<NativeStackNavigationProp<MessagesStackParamList>>();
  const { matchId, profile } = route.params;
  return (
    <ChatScreen
      match={{ matchId, profile }}
      onBack={() => navigation.goBack()}
      onProfile={() => navigation.navigate('Person', { matchId, profile })}
      onBlocked={() => navigation.popToTop()}
      onUnmatched={() => navigation.popToTop()}
    />
  );
}

function MessagesPersonRoute() {
  const route = useRoute<RouteProp<MessagesStackParamList, 'Person'>>();
  const navigation = useNavigation<NativeStackNavigationProp<MessagesStackParamList>>();
  const { profile, matchId } = route.params;
  return (
    <PersonScreen
      profile={profile}
      matchId={matchId}
      onBack={() => navigation.goBack()}
      onMessage={() => navigation.navigate('Chat', { matchId, profile })}
      onBlocked={() => navigation.popToTop()}
      onUnmatched={() => navigation.popToTop()}
    />
  );
}
