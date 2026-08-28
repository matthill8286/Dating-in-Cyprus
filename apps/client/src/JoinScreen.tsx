import { useState } from 'react';
import {
  Button,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { api } from './api/client';
import { useApp } from './context/AppContext';
import {
  completeJoin,
  GENDERS,
  joinApiErrorCode,
  joinRefusalMessage,
  LAUNCH_LANGUAGES,
  SEEKING,
  type Gender,
  type JoinFormValues,
  type LaunchLanguage,
  type Seeking,
} from './join';

const initialForm: JoinFormValues = {
  email: '',
  password: '',
  dateOfBirth: '2000-01-01',
  launchLanguage: 'en',
  gender: 'man',
  seeking: 'women',
  specialCategoryConsent: false,
  mobile: '+357',
  primaryHomeAttestation: false,
  presence: null,
};

function ChoiceRow<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.row}>
      {options.map((option) => (
        <Pressable key={option} onPress={() => onChange(option)}>
          <Text style={option === value ? styles.chosen : styles.choice}>{option}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function JoinScreen() {
  const { setSessionToken } = useApp();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);

  const onJoin = async () => {
    const result = await completeJoin(form, postJoin, setSessionToken);
    setError(result.ok ? null : joinRefusalMessage(result.code));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>Join</Text>
      <AccountFields form={form} setForm={setForm} />
      <GateFields form={form} setForm={setForm} />
      {error ? <Text>{error}</Text> : null}
      <Button title="Join" onPress={() => void onJoin()} />
    </ScrollView>
  );
}

function AccountFields({
  form,
  setForm,
}: {
  form: JoinFormValues;
  setForm: (update: (current: JoinFormValues) => JoinFormValues) => void;
}) {
  return (
    <>
      <TextInput
        autoCapitalize="none"
        placeholder="email"
        value={form.email}
        onChangeText={(email) => setForm((current) => ({ ...current, email }))}
        style={styles.input}
      />
      <TextInput
        placeholder="password"
        secureTextEntry
        value={form.password}
        onChangeText={(password) => setForm((current) => ({ ...current, password }))}
        style={styles.input}
      />
      <TextInput
        placeholder="date of birth YYYY-MM-DD"
        value={form.dateOfBirth}
        onChangeText={(dateOfBirth) => setForm((current) => ({ ...current, dateOfBirth }))}
        style={styles.input}
      />
      <Text>Launch language</Text>
      <ChoiceRow
        options={LAUNCH_LANGUAGES}
        value={form.launchLanguage}
        onChange={(launchLanguage: LaunchLanguage) =>
          setForm((current) => ({ ...current, launchLanguage }))
        }
      />
      <Text>Gender</Text>
      <ChoiceRow
        options={GENDERS}
        value={form.gender}
        onChange={(gender: Gender) => setForm((current) => ({ ...current, gender }))}
      />
      <Text>Seeking</Text>
      <ChoiceRow
        options={SEEKING}
        value={form.seeking}
        onChange={(seeking: Seeking) => setForm((current) => ({ ...current, seeking }))}
      />
    </>
  );
}

function GateFields({
  form,
  setForm,
}: {
  form: JoinFormValues;
  setForm: (update: (current: JoinFormValues) => JoinFormValues) => void;
}) {
  return (
    <>
      <TextInput
        autoCapitalize="none"
        placeholder="Cyprus mobile +357..."
        value={form.mobile}
        onChangeText={(mobile) => setForm((current) => ({ ...current, mobile }))}
        style={styles.input}
      />
      <Pressable
        onPress={() =>
          setForm((current) => ({
            ...current,
            presence: { latitude: 34.685, longitude: 33.038 },
          }))
        }
      >
        <Text>
          {form.presence ? '[x]' : '[ ]'} Presence in the Operating area
        </Text>
      </Pressable>
      <Pressable
        onPress={() =>
          setForm((current) => ({
            ...current,
            primaryHomeAttestation: !current.primaryHomeAttestation,
          }))
        }
      >
        <Text>
          {form.primaryHomeAttestation ? '[x]' : '[ ]'} Primary home is in the Operating area
        </Text>
      </Pressable>
      <Pressable
        onPress={() =>
          setForm((current) => ({
            ...current,
            specialCategoryConsent: !current.specialCategoryConsent,
          }))
        }
      >
        <Text>
          {form.specialCategoryConsent ? '[x]' : '[ ]'} Consent to gender and who-you-meet
        </Text>
      </Pressable>
    </>
  );
}

async function postJoin(values: JoinFormValues) {
  if (!values.presence) return { error: { code: 'invalid' } };
  const { data, error } = await api.POST('/v1/accounts', {
    body: {
      email: values.email,
      password: values.password,
      dateOfBirth: values.dateOfBirth,
      launchLanguage: values.launchLanguage,
      gender: values.gender,
      seeking: values.seeking,
      specialCategoryConsent: true,
      mobile: values.mobile,
      primaryHomeAttestation: true,
      presence: values.presence,
    },
  });
  return {
    data: data ?? undefined,
    error: error ? { code: joinApiErrorCode(error) } : undefined,
  };
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24, gap: 8 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  choice: { padding: 4 },
  chosen: { padding: 4, fontWeight: '700' },
});
