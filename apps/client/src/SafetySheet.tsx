import { useState } from 'react';
import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import {
  afterSafety,
  REPORT_REASON_LABELS,
  REPORT_REASONS,
  safetyOnOwnProfile,
  submitBlock,
  submitReport,
  type ReportReason,
} from './safety';
import { color, font } from './theme';
import { ChipRow, GhostButton, MuteNote, PrimaryButton } from './ui/kit';

type Step = 'menu' | 'block' | 'report';

export function SafetySheet({
  name,
  profileId,
  token,
  onClose,
  onBlocked,
}: {
  name: string;
  profileId: string;
  token: string;
  onClose: () => void;
  onBlocked: () => void;
}) {
  const [step, setStep] = useState<Step>('menu');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.mask} accessibilityViewIsModal>
        <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          {step === 'menu' ? (
            <SafetyMenu name={name} onBlock={() => setStep('block')} onReport={() => setStep('report')} onClose={onClose} />
          ) : null}
          {step === 'block' ? (
            <SafetyBlock
              name={name}
              busy={busy}
              onBack={() => setStep('menu')}
              onConfirm={() =>
                void runBlock(token, profileId, busy, setBusy, onBlocked)
              }
            />
          ) : null}
          {step === 'report' ? (
            <SafetyReport
              reason={reason}
              busy={busy}
              onReason={(next) => setReason(next as ReportReason)}
              onBack={() => setStep('menu')}
              onConfirm={() =>
                void runReport(token, profileId, reason, busy, setBusy, onClose)
              }
            />
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

export function OpenSafetySheet({
  open,
  name,
  profileId,
  token,
  onClose,
  onBlocked,
}: {
  open: boolean;
  name: string;
  profileId: string;
  token: string | null;
  onClose: () => void;
  onBlocked: () => void;
}) {
  if (!open || !token) return null;
  return (
    <SafetySheet
      name={name}
      profileId={profileId}
      token={token}
      onClose={onClose}
      onBlocked={onBlocked}
    />
  );
}

export function PersonSafety({
  own,
  name,
  profileId,
  token,
  onBlocked,
}: {
  own: boolean;
  name: string;
  profileId: string;
  token: string | null;
  onBlocked?: () => void;
}) {
  const [open, setOpen] = useState(false);
  if (!safetyOnOwnProfile(own)) return null;
  return (
    <>
      <SafetyLink onPress={() => setOpen(true)} />
      <OpenSafetySheet
        open={open}
        name={name}
        profileId={profileId}
        token={token}
        onClose={() => setOpen(false)}
        onBlocked={() => {
          setOpen(false);
          onBlocked?.();
        }}
      />
    </>
  );
}

export function SafetyLink({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Block or Report">
      <Text style={styles.link}>Block or Report</Text>
    </Pressable>
  );
}

function SafetyMenu({
  name,
  onBlock,
  onReport,
  onClose,
}: {
  name: string;
  onBlock: () => void;
  onReport: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <Text style={styles.title}>Safety</Text>
      <MuteNote>{`Block or Report ${name} from here or from chat.`}</MuteNote>
      <PrimaryButton title={`Block ${name}`} onPress={onBlock} />
      <GhostButton title={`Report ${name}`} onPress={onReport} />
      <GhostButton title="Not now" onPress={onClose} />
    </>
  );
}

function SafetyBlock({
  name,
  busy,
  onBack,
  onConfirm,
}: {
  name: string;
  busy: boolean;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <Text style={styles.title}>{`Block ${name}?`}</Text>
      <MuteNote>You will not see each other in discovery, and this Match cannot be used for messages.</MuteNote>
      <PrimaryButton title={busy ? 'Blocking…' : 'Block'} onPress={onConfirm} />
      <GhostButton title="Back" onPress={onBack} />
    </>
  );
}

function SafetyReport({
  reason,
  busy,
  onReason,
  onBack,
  onConfirm,
}: {
  reason: ReportReason | null;
  busy: boolean;
  onReason: (next: string) => void;
  onBack: () => void;
  onConfirm: () => void;
}) {
  return (
    <>
      <Text style={styles.title}>Report</Text>
      <MuteNote>This does not remove them from the Pool. Choose a reason.</MuteNote>
      <ChipRow
        caption="Reason"
        options={REPORT_REASONS}
        value={reason ?? ''}
        onChange={onReason}
        labels={REPORT_REASON_LABELS}
      />
      <PrimaryButton
        title={busy ? 'Sending…' : 'Report'}
        onPress={onConfirm}
      />
      <GhostButton title="Back" onPress={onBack} />
    </>
  );
}

async function runBlock(
  token: string,
  profileId: string,
  busy: boolean,
  setBusy: (value: boolean) => void,
  onBlocked: () => void,
) {
  if (busy) return;
  setBusy(true);
  const ok = await submitBlock(token, profileId);
  setBusy(false);
  if (ok && afterSafety('block') === 'leave') onBlocked();
}

async function runReport(
  token: string,
  profileId: string,
  reason: ReportReason | null,
  busy: boolean,
  setBusy: (value: boolean) => void,
  onClose: () => void,
) {
  if (!reason || busy) return;
  setBusy(true);
  const ok = await submitReport(token, profileId, reason);
  setBusy(false);
  if (ok && afterSafety('report') === 'stay') onClose();
}

const styles = StyleSheet.create({
  mask: { flex: 1, justifyContent: 'flex-end' },
  dim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: color.overlay,
  },
  sheet: {
    backgroundColor: color.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
  },
  title: { fontFamily: font.display, fontSize: 24, fontWeight: '700', color: color.ink },
  link: { color: color.rose, fontFamily: font.body, fontSize: 14, fontWeight: '700', marginTop: 16 },
});
