import { useState } from 'react';
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
import { languageLabel } from './theme';
import { VerifyCard } from './VerifyCard';
import {
  Card,
  ChipRow,
  ErrorNote,
  Field,
  Hero,
  PrimaryButton,
  Screen,
  SectionLabel,
  Sheet,
} from './ui/kit';

function toForm(profile: Profile | null): ProfileFormValues {
  return {
    firstName: profile?.firstName ?? '',
    city: profile?.city ?? 'Limassol',
    languagesSpoken: profile?.languagesSpoken ?? ['en'],
    bio: profile?.bio ?? '',
  };
}

export function ProfileEditScreen({ onSaved }: { onSaved?: () => void }) {
  const { sessionToken, profile, setProfile } = useApp();
  const [form, setForm] = useState(() => toForm(profile));
  const [error, setError] = useState<string | null>(null);

  const onSave = async () => {
    const result = await saveProfile(
      form,
      (values) => patchProfile(sessionToken, values),
      setProfile,
    );
    if (result.ok) onSaved?.();
    setError(result.ok ? null : 'Check first name, city, languages, and bio.');
  };

  return (
    <Screen>
      <Hero
        kicker={profile?.city ?? 'Here'}
        title={profile ? 'Edit profile' : 'Profile details'}
        subtitle="A first name, a city, languages you speak, a few lines. No last name."
      />
      <Sheet>
        <Card>
          <Field
            label="First name"
            value={form.firstName}
            onChangeText={(firstName) => setForm((current) => ({ ...current, firstName }))}
            placeholder="What people should call you"
          />
          <SectionLabel>City</SectionLabel>
          <ChipRow
            options={OPERATING_AREA_CITIES}
            value={form.city}
            onChange={(city) => setForm((current) => ({ ...current, city }))}
          />
          <SectionLabel>Languages you speak</SectionLabel>
          <ChipRow
            options={PROFILE_LANGUAGES}
            value={form.languagesSpoken}
            labels={languageLabel}
            multi
            onChange={(language) => setForm((current) => toggleLanguage(current, language))}
          />
          <Field
            label="Short bio"
            value={form.bio}
            onChangeText={(bio) => setForm((current) => ({ ...current, bio }))}
            placeholder="A few lines about you"
            multiline
          />
          <ErrorNote message={error} />
          <PrimaryButton title={profile ? 'Save' : 'Confirm'} onPress={() => void onSave()} />
          {profile && sessionToken ? (
            <VerifyCard token={sessionToken} profile={profile} onMark={setProfile} />
          ) : null}
        </Card>
      </Sheet>
    </Screen>
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
