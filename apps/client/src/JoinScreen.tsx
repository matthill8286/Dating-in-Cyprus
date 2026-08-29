import { useState } from 'react';
import { api } from './api/client';
import { useApp } from './context/AppContext';
import {
  completeJoin,
  GENDERS,
  joinApiErrorCode,
  joinInvalidMessage,
  joinRefusalMessage,
  LAUNCH_LANGUAGES,
  SEEKING,
  type Gender,
  type JoinFormValues,
  type LaunchLanguage,
  type Seeking,
} from './join';
import { genderLabel, languageLabel, seekingLabel } from './theme';
import {
  Card,
  CheckRow,
  ChipRow,
  ErrorNote,
  Field,
  Hero,
  MuteNote,
  PrimaryButton,
  Screen,
  SectionLabel,
  Sheet,
  GhostButton,
} from './ui/kit';

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

export function JoinScreen({ onSignIn }: { onSignIn: () => void }) {
  const { setSessionToken } = useApp();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState<string | null>(null);

  const onJoin = async () => {
    const result = await completeJoin(form, postJoin, setSessionToken);
    setError(
      result.ok
        ? null
        : result.code === 'invalid'
          ? joinInvalidMessage(form)
          : joinRefusalMessage(result.code),
    );
  };

  return (
    <Screen>
      <Hero
        kicker="Republic of Cyprus"
        title="Create account"
        subtitle="Dating for people whose primary home is on the island. Not a holiday. Not a stopover."
      />
      <Sheet>
        <Card>
          <AccountFields form={form} setForm={setForm} />
          <GateFields form={form} setForm={setForm} />
          <ErrorNote message={error} />
          <PrimaryButton title="Request a place" onPress={() => void onJoin()} />
          <GhostButton title="Sign in" onPress={onSignIn} />
          <MuteNote>Twenty-one and over. Residents only.</MuteNote>
        </Card>
      </Sheet>
    </Screen>
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
      <SectionLabel>Account</SectionLabel>
      <Field
        label="Email"
        value={form.email}
        onChangeText={(email) => setForm((current) => ({ ...current, email }))}
        placeholder="you@example.com"
        autoCapitalize="none"
      />
      <Field
        label="Password"
        value={form.password}
        onChangeText={(password) => setForm((current) => ({ ...current, password }))}
        placeholder="At least 8 characters"
        secure
      />
      <Field
        label="Date of birth"
        value={form.dateOfBirth}
        onChangeText={(dateOfBirth) => setForm((current) => ({ ...current, dateOfBirth }))}
        placeholder="YYYY-MM-DD"
      />
      <SectionLabel>Language</SectionLabel>
      <ChipRow
        options={LAUNCH_LANGUAGES}
        value={form.launchLanguage}
        labels={languageLabel}
        onChange={(launchLanguage) =>
          setForm((current) => ({ ...current, launchLanguage: launchLanguage as LaunchLanguage }))
        }
      />
      <ChipRow
        caption="I am"
        options={GENDERS}
        value={form.gender}
        labels={genderLabel}
        onChange={(gender) => setForm((current) => ({ ...current, gender: gender as Gender }))}
      />
      <ChipRow
        caption="I want to meet"
        options={SEEKING}
        value={form.seeking}
        labels={seekingLabel}
        onChange={(seeking) => setForm((current) => ({ ...current, seeking: seeking as Seeking }))}
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
      <SectionLabel>On the island</SectionLabel>
      <Field
        label="Cyprus mobile"
        value={form.mobile}
        onChangeText={(mobile) => setForm((current) => ({ ...current, mobile }))}
        placeholder="+3579…"
        autoCapitalize="none"
      />
      <CheckRow
        label="I am in the Republic of Cyprus now"
        hint="Checked when you join. We do not operate in Northern Cyprus."
        on={form.presence !== null}
        onPress={() =>
          setForm((current) => ({
            ...current,
            presence: current.presence ? null : { latitude: 34.685, longitude: 33.038 },
          }))
        }
      />
      <CheckRow
        label="My primary home is in the Republic of Cyprus"
        hint="A holiday or short stay is not enough. Your primary home must be here."
        on={form.primaryHomeAttestation}
        onPress={() =>
          setForm((current) => ({
            ...current,
            primaryHomeAttestation: !current.primaryHomeAttestation,
          }))
        }
      />
      <CheckRow
        label="Gender and who I want to meet may be used for matching"
        on={form.specialCategoryConsent}
        onPress={() =>
          setForm((current) => ({
            ...current,
            specialCategoryConsent: !current.specialCategoryConsent,
          }))
        }
      />
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
