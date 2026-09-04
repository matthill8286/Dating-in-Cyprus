import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { JoinScreen } from '../JoinScreen';
import { OnboardingScreen } from '../OnboardingScreen';
import { SignInScreen } from '../SignInScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding">
        {({ navigation }) => (
          <OnboardingScreen
            onCreate={() => navigation.navigate('Join')}
            onSignIn={() => navigation.navigate('SignIn')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Join">
        {({ navigation }) => (
          <JoinScreen onSignIn={() => navigation.navigate('SignIn')} onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="SignIn">
        {({ navigation }) => (
          <SignInScreen onJoin={() => navigation.navigate('Join')} onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
