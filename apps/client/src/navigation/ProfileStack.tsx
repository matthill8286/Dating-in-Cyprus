import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ProfileEditScreen } from '../ProfileEditScreen';
import { ProfileViewScreen } from '../ProfileViewScreen';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileView" component={ProfileViewRoute} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditRoute} />
    </Stack.Navigator>
  );
}

function ProfileViewRoute() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  return <ProfileViewScreen onEdit={() => navigation.navigate('ProfileEdit')} />;
}

function ProfileEditRoute() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  return <ProfileEditScreen onSaved={() => navigation.goBack()} />;
}
