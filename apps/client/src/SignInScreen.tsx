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

export function SignInScreen({ onJoin }: { onJoin: () => void }) {
  const { setSessionToken } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSignIn = async () => {
    const result = await completeSignIn({ email, password }, postSignIn, setSessionToken);
    setError(result.ok ? null : signInRefusalMessage(result.code));
  };

  return (
    <Screen>
      <Hero
        kicker="Republic of Cyprus"
        title="Sign in"
        subtitle="Welcome back."
      />
      <Sheet>
        <Card>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            autoCapitalize="none"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Your password"
            secure
          />
          <ErrorNote message={error} />
          <PrimaryButton title="Sign in" onPress={() => void onSignIn()} />
          <GhostButton title="Request a place" onPress={onJoin} />
          <MuteNote>Twenty-one and over. Residents only.</MuteNote>
        </Card>
      </Sheet>
    </Screen>
  );
}

async function postSignIn(values: SignInValues) {
  const { data, error } = await api.POST('/v1/sessions', {
    body: { email: values.email, password: values.password },
  });
  return {
    data: data ?? undefined,
    error: error ? { code: joinApiErrorCode(error) } : undefined,
  };
}
