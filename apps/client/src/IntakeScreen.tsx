import { useState } from 'react';
import { ScrollView, View, StyleSheet } from 'react-native';
import { api } from './api/client';
import { useApp } from './context/AppContext';
import { HostComposer, HostHeader, HostMessage } from './hostChrome';
import { replyIntake, startIntake, type IntakeStep } from './intake';
import { joinApiErrorCode } from './join';
import {
  OPERATING_AREA_CITIES,
  PROFILE_LANGUAGES,
  saveProfile,
  type Profile,
  type ProfileFormValues,
} from './profile';
import { languageLabel } from './theme';
import { ChipRow } from './ui/kit';
import { Fixed } from './ui/deck';
import { page } from './ui/layout';

export function IntakeScreen({ onSaved }: { onSaved: () => void }) {
  const { sessionToken, setProfile } = useApp();
  const [state, setState] = useState(startIntake);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);

  const apply = async (text: string) => {
    const next = replyIntake(state, text);
    setState(next);
    setDraft('');
    if (!next.done) return;
    setBusy(true);
    const result = await saveProfile(next.form, (values) => patchMe(sessionToken, values), setProfile);
    setBusy(false);
    if (result.ok) {
      onSaved();
      return;
    }
    setState({
      ...next,
      done: false,
      lines: [...next.lines, { id: 'save-fail', kind: 'host', body: saveRefusal(result.code) }],
    });
  };

  return (
    <Fixed footer={<IntakeFooter step={state.step} draft={draft} busy={busy} onDraft={setDraft} onSend={apply} />}>
      <ScrollView contentContainerStyle={styles.thread} style={styles.scroll}>
        <HostHeader />
        <View style={styles.lines}>
          {state.lines.map((line) => (
            <HostMessage key={line.id} line={line} />
          ))}
        </View>
      </ScrollView>
    </Fixed>
  );
}

function saveRefusal(code: string): string {
  if (code === 'network') return 'I cannot reach the island. Check your connection and send again.';
  return 'I could not save that. Try those lines again.';
}

function IntakeFooter({
  step,
  draft,
  busy,
  onDraft,
  onSend,
}: {
  step: IntakeStep;
  draft: string;
  busy: boolean;
  onDraft: (text: string) => void;
  onSend: (text: string) => void;
}) {
  return (
    <View style={styles.footer}>
      {step === 'city' ? (
        <View style={styles.chips}>
          <ChipRow options={OPERATING_AREA_CITIES} value={draft} onChange={(city) => void onSend(city)} />
        </View>
      ) : null}
      {step === 'languages' ? (
        <View style={styles.chips}>
          <ChipRow
            options={PROFILE_LANGUAGES}
            value={parseLanguagesDraft(draft)}
            labels={languageLabel}
            multi
            onChange={(code) => onDraft(toggleLanguageDraft(draft, code))}
          />
        </View>
      ) : null}
      <HostComposer
        value={draft}
        onChange={onDraft}
        busy={busy}
        placeholder={placeholderFor(step)}
        sendLabel="Send"
        onSend={() => void onSend(draft)}
      />
    </View>
  );
}

function placeholderFor(step: IntakeStep): string {
  if (step === 'name') return 'What people should call you';
  if (step === 'city') return 'Limassol, Nicosia…';
  if (step === 'languages') return 'English, Ukrainian…';
  return 'A few lines about you';
}

function parseLanguagesDraft(draft: string): string[] {
  return PROFILE_LANGUAGES.filter(
    (code) => draft.toLowerCase().includes(code) || draft.toLowerCase().includes(languageLabel[code].toLowerCase()),
  );
}

function toggleLanguageDraft(draft: string, code: string): string {
  const picked = new Set(parseLanguagesDraft(draft));
  if (picked.has(code)) picked.delete(code);
  else picked.add(code);
  return [...picked].map((item) => languageLabel[item]).join(', ');
}

async function patchMe(token: string | null, values: ProfileFormValues) {
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
  scroll: { flex: 1 },
  thread: {
    ...page,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 20,
  },
  lines: { gap: 16 },
  footer: { paddingBottom: 12, gap: 8, ...page },
  chips: { paddingHorizontal: 24 },
});
