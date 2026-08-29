import { useState } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { api } from './api/client';
import { useApp } from './context/AppContext';
import {
  completeJoin,
  joinApiErrorCode,
  joinInvalidMessage,
  joinRefusalMessage,
  joinStepComplete,
  nextJoinStep,
  prevJoinStep,
  type JoinFormValues,
  type JoinStep,
} from './join';
import { STEP_COPY, StepBody } from './joinSteps';
import { color, font } from './theme';
import { ErrorNote, GhostButton, MuteNote, PrimaryButton, Screen, Sheet } from './ui/kit';

const initialForm: JoinFormValues = {
  email: '',
  password: '',
  dateOfBirth: '',
  launchLanguage: 'en',
  gender: 'man',
  seeking: 'women',
  specialCategoryConsent: false,
  mobile: '+357',
  primaryHomeAttestation: false,
  presence: null,
};

export function JoinScreen({
  onSignIn,
  onBack,
}: {
  onSignIn: () => void;
  onBack?: () => void;
}) {
  const { setSessionToken } = useApp();
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState<JoinStep>('email');
  const [picker, setPicker] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = STEP_COPY[step];

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

  function goBack() {
    const prev = prevJoinStep(step);
    if (prev === 'exit') onBack?.();
    else setStep(prev);
    setPicker(false);
  }

  function goNext() {
    if (!joinStepComplete(step, form)) {
      setError(
        step === 'birthday'
          ? 'You must be 21 or over. Choose a birthday date.'
          : 'Check this step and try again.',
      );
      return;
    }
    setError(null);
    const next = nextJoinStep(step);
    if (next === 'done') void onJoin();
    else setStep(next);
    setPicker(false);
  }

  return (
    <Screen>
      <Sheet>
        <View style={styles.top}>
          <Pressable onPress={goBack} accessibilityRole="button" accessibilityLabel="Back">
            <Text style={styles.back}>‹</Text>
          </Pressable>
          <GhostButton title="Sign in" onPress={onSignIn} />
        </View>
        <Text style={styles.title}>{copy.title}</Text>
        <Text style={styles.subtitle}>{copy.subtitle}</Text>
        <StepBody
          step={step}
          form={form}
          setForm={setForm}
          picker={picker}
          onOpenPicker={() => setPicker((open) => !open)}
        />
        <ErrorNote message={error} />
        <PrimaryButton title={copy.action} onPress={goNext} />
        <MuteNote>Twenty-one and over. Residents only.</MuteNote>
      </Sheet>
    </Screen>
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
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { fontSize: 32, color: color.ink, lineHeight: 36 },
  title: {
    fontFamily: font.display,
    fontSize: 32,
    fontWeight: '700',
    color: color.ink,
    marginTop: 8,
  },
  subtitle: { fontFamily: font.body, fontSize: 15, lineHeight: 22, color: color.mute },
});
