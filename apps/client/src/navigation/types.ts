import type { NavigatorScreenParams } from '@react-navigation/native';
import type { InboxRow } from '../match';
import type { Profile } from '../profile';
import type { MainTab } from '../ui/tabs';

export type AuthStackParamList = {
  Onboarding: undefined;
  Join: undefined;
  SignIn: undefined;
};

export type PeopleStackParamList = {
  Host: undefined;
  Island: undefined;
  Person: { profile: Profile; matchId?: string };
};

export type MatchesStackParamList = {
  MatchesList: undefined;
  Person: { profile: Profile; matchId: string };
  Chat: { matchId: string; profile: Profile };
};

export type MessagesStackParamList = {
  MessagesList: undefined;
  Chat: { matchId: string; profile: Profile };
  Person: { profile: Profile; matchId: string };
};

export type ProfileStackParamList = {
  ProfileView: undefined;
  ProfileEdit: undefined;
};

export type MainTabParamList = {
  Here: NavigatorScreenParams<PeopleStackParamList>;
  Matches: NavigatorScreenParams<MatchesStackParamList>;
  Messages: NavigatorScreenParams<MessagesStackParamList>;
  Profile: NavigatorScreenParams<ProfileStackParamList>;
};

export const TAB_ROUTE: Record<MainTab, keyof MainTabParamList> = {
  people: 'Here',
  matches: 'Matches',
  messages: 'Messages',
  profile: 'Profile',
};

export const TAB_ROOT_SCREEN: Record<keyof MainTabParamList, string> = {
  Here: 'Host',
  Matches: 'MatchesList',
  Messages: 'MessagesList',
  Profile: 'ProfileView',
};

export type MatchOpen = InboxRow;
