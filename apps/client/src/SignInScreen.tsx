import { useState } from 'react';
import { api } from './api/client';
import { useApp } from './context/AppContext';
import { joinApiErrorCode } from './join';
import { completeSignIn, signInRefusalMessage, type SignInValues } from './signIn';
import {
  Card,
  ErrorNote,
  Field,
  GhostButton,
  Hero,
  MuteNote,
  PrimaryButton,
  Screen,
  Sheet,
} from './ui/kit';

export function SignInScreen({
  onJoin,
  onBack,
}: {
  onJoin: () => void;
  onBack?: () => void;
}) {
  const { setSessionToken } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSignIn = async () => {
    try {
      const result = await completeSignIn({ email, password }, postSignIn, setSessionToken);
      setError(result.ok ? null : signInRefusalMessage(result.code));
    } catch {
      setError(signInRefusalMessage('network'));
    }
  };

  return (
    <Screen>
      <Hero
        kicker="Republic of Cyprus"
        title="Sign in"
        subtitle="Welcome back."
      />
      <Sheet>
        {onBack ? <GhostButton title="Back" onPress={onBack} /> : null}
        <Card>
          <Field
            kind="email"
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            returnKeyType="next"
          />
          <Field
            kind="password"
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            returnKeyType="go"
            onSubmitEditing={() => void onSignIn()}
          />
          <ErrorNote message={error} />
          <PrimaryButton title="Sign in" onPress={() => void onSignIn()} />
          <GhostButton title="Create an account" onPress={onJoin} />
          <MuteNote>Twenty-one and over. Residents only.</MuteNote>
        </Card>
      </Sheet>
    </Screen>
  );
}

async function postSignIn(values: SignInValues) {
  try {
    const { data, error, response } = await api.POST('/v1/sessions', {
      body: { email: values.email, password: values.password },
    });
    if (data?.token) return { data: { token: data.token } };
    if (error) return { error: { code: joinApiErrorCode(error) } };
    if (!response) return { error: { code: 'network' } };
    return { error: { code: 'error' } };
  } catch {
    return { error: { code: 'network' } };
  }
}
