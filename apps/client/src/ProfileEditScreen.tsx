import { useState } from 'react';
import { Button, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { api } from './api/client';
import { useApp } from './context/AppContext';
import { joinApiErrorCode } from './join';
import {
  OPERATING_AREA_CITIES,
  PROFILE_LANGUAGES,
  saveProfile,
  type Profile,
  type ProfileFormValues,
} from './profile';

const initialForm: ProfileFormValues = {
  firstName: '',
  city: 'Limassol',
  languagesSpoken: ['en'],
  bio: '',
};

export function ProfileEditScreen() {
  const { sessionToken, setProfile } = useApp();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    const result = await saveProfile(form, (values) => patchProfile(sessionToken, values), setProfile);
    setError(result.ok ? null : 'Check first name, city, languages, and bio.');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text>Profile</Text>
      <TextInput
        placeholder="first name"
        value={form.firstName}
        onChangeText={(firstName) => setForm((current) => ({ ...current, firstName }))}
        style={styles.input}
      />
      <Text>City</Text>
      <View style={styles.row}>
        {OPERATING_AREA_CITIES.map((city) => (
          <Pressable key={city} onPress={() => setForm((current) => ({ ...current, city }))}>
            <Text style={city === form.city ? styles.chosen : styles.choice}>{city}</Text>
          </Pressable>
        ))}
      </View>
      <Text>Languages spoken</Text>
      <View style={styles.row}>
        {PROFILE_LANGUAGES.map((language) => (
          <Pressable
            key={language}
            onPress={() => setForm((current) => toggleLanguage(current, language))}
          >
            <Text style={form.languagesSpoken.includes(language) ? styles.chosen : styles.choice}>
              {language}
            </Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        placeholder="short bio"
        value={form.bio}
        onChangeText={(bio) => setForm((current) => ({ ...current, bio }))}
        style={styles.input}
      />
      {error ? <Text>{error}</Text> : null}
      <Button title="Save Profile" onPress={() => void onSave()} />
    </ScrollView>
  );
}

function toggleLanguage(form: ProfileFormValues, language: string): ProfileFormValues {
  const has = form.languagesSpoken.includes(language);
  const languagesSpoken = has
    ? form.languagesSpoken.filter((item) => item !== language)
    : [...form.languagesSpoken, language];
  return { ...form, languagesSpoken };
}

async function patchProfile(token: string | null, values: ProfileFormValues) {
  const { data, error } = await api.PATCH('/v1/profiles/me', {
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: {
      firstName: values.firstName,
      city: values.city as Profile['city'],
      languagesSpoken: values.languagesSpoken as Profile['languagesSpoken'],
      bio: values.bio,
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
