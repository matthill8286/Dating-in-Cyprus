import { Pressable, Text, View, StyleSheet } from 'react-native';
import { BirthdayFields } from './joinBirthday';
import {
  LAUNCH_LANGUAGES,
  localFromMobile,
  mobileFromLocal,
  SEEKING,
  type Gender,
  type JoinFormValues,
  type JoinStep,
  type LaunchLanguage,
  type Seeking,
} from './join';
import { genderLabel, languageLabel, seekingLabel, color, font } from './theme';
import { CheckRow, ChipRow, Field } from './ui/kit';

export const STEP_COPY: Record<JoinStep, { title: string; subtitle: string; action: string }> = {
  email: {
    title: 'Sign up to continue',
    subtitle: 'Email and a password. Then a Cyprus mobile.',
    action: 'Continue',
  },
  mobile: {
    title: 'My mobile',
    subtitle: 'A Cyprus mobile is how we know you belong on the island. We do not send a code in v1.',
    action: 'Continue',
  },
  identity: {
    title: 'I am a',
    subtitle: 'Used for matching. Woman seeking men, or man seeking women, in v1.',
    action: 'Continue',
  },
  seeking: {
    title: 'I want to meet',
    subtitle: 'You will only see people who match this.',
    action: 'Continue',
  },
  birthday: {
    title: 'Your birthday',
    subtitle: 'You must be 21 or over. Age is shown on your Profile. Date of birth is not.',
    action: 'Continue',
  },
  island: {
    title: 'On the island',
    subtitle: 'A Visitor is refused. Primary home must be in the Republic of Cyprus.',
    action: 'Create account',
  },
};

export function StepBody({
  step,
  form,
  setForm,
  picker,
  onOpenPicker,
}: {
  step: JoinStep;
  form: JoinFormValues;
  setForm: (update: (current: JoinFormValues) => JoinFormValues) => void;
  picker: boolean;
  onOpenPicker: () => void;
}) {
  if (step === 'email') return <EmailFields form={form} setForm={setForm} />;
  if (step === 'mobile') return <MobileFields form={form} setForm={setForm} />;
  if (step === 'identity') {
    return (
      <ChoiceList
        options={['woman', 'man']}
        value={form.gender}
        labels={genderLabel}
        onChange={(gender) => setForm((current) => ({ ...current, gender: gender as Gender }))}
      />
    );
  }
  if (step === 'seeking') {
    return (
      <ChoiceList
        options={SEEKING}
        value={form.seeking}
        labels={seekingLabel}
        onChange={(seeking) => setForm((current) => ({ ...current, seeking: seeking as Seeking }))}
      />
    );
  }
  if (step === 'birthday') {
    return <BirthdayFields form={form} setForm={setForm} picker={picker} onToggle={onOpenPicker} />;
  }
  return <IslandFields form={form} setForm={setForm} />;
}

function EmailFields({
  form,
  setForm,
}: {
  form: JoinFormValues;
  setForm: (update: (current: JoinFormValues) => JoinFormValues) => void;
}) {
  return (
    <>
      <Field
        kind="email"
        label="Email"
        value={form.email}
        onChangeText={(email) => setForm((current) => ({ ...current, email }))}
        placeholder="you@example.com"
      />
      <Field
        kind="password"
        label="Password"
        value={form.password}
        onChangeText={(password) => setForm((current) => ({ ...current, password }))}
        placeholder="At least 8 characters"
      />
      <ChipRow
        caption="Language"
        options={LAUNCH_LANGUAGES}
        value={form.launchLanguage}
        labels={languageLabel}
        onChange={(launchLanguage) =>
          setForm((current) => ({ ...current, launchLanguage: launchLanguage as LaunchLanguage }))
        }
      />
    </>
  );
}

function MobileFields({
  form,
  setForm,
}: {
  form: JoinFormValues;
  setForm: (update: (current: JoinFormValues) => JoinFormValues) => void;
}) {
  return (
    <View style={styles.phone}>
      <View style={styles.code}>
        <Text style={styles.codeText}>🇨🇾 +357</Text>
      </View>
      <View style={styles.phoneField}>
        <Field
          kind="phone"
          label="Cyprus mobile"
          value={localFromMobile(form.mobile)}
          onChangeText={(digits) =>
            setForm((current) => ({ ...current, mobile: mobileFromLocal(digits) }))
          }
          placeholder="9xxxxxxx"
        />
      </View>
    </View>
  );
}

function IslandFields({
  form,
  setForm,
}: {
  form: JoinFormValues;
  setForm: (update: (current: JoinFormValues) => JoinFormValues) => void;
}) {
  return (
    <>
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
        hint="A holiday or short stay is not enough."
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

function ChoiceList({
  options,
  value,
  labels,
  onChange,
}: {
  options: readonly string[];
  value: string;
  labels: Record<string, string>;
  onChange: (next: string) => void;
}) {
  return (
    <View style={styles.choices}>
      {options.map((option) => {
        const on = value === option;
        return (
          <Pressable
            key={option}
            onPress={() => onChange(option)}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={[styles.choice, on ? styles.choiceOn : null]}
          >
            <Text style={[styles.choiceText, on ? styles.choiceTextOn : null]}>
              {labels[option] ?? option}
            </Text>
            <Text style={[styles.tick, on ? styles.tickOn : null]}>{on ? '✓' : ''}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  phone: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  code: {
    height: 52,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.line,
    justifyContent: 'center',
    marginBottom: 1,
  },
  codeText: { fontFamily: font.body, fontSize: 15, fontWeight: '700', color: color.ink },
  phoneField: { flex: 1 },
  choices: { gap: 12 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: color.line,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: color.paper,
  },
  choiceOn: { backgroundColor: color.rose, borderColor: color.rose },
  choiceText: { fontFamily: font.body, fontSize: 16, fontWeight: '600', color: color.ink },
  choiceTextOn: { color: color.onRose },
  tick: { fontSize: 18, color: color.mute },
  tickOn: { color: color.onRose },
});
