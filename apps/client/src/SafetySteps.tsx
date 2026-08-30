import {
  afterSafety,
  REPORT_REASON_LABELS,
  REPORT_REASONS,
  submitBlock,
  submitReport,
  submitUnmatch,
  type ReportReason,
} from './safety';
import { color, font } from './theme';
import { ChipRow, GhostButton, MuteNote, PrimaryButton } from './ui/kit';
import { Text, StyleSheet } from 'react-native';

export function SafetyMenu({
  name,
  canUnmatch,
  onBlock,
  onReport,
  onUnmatch,
  onClose,
}: {
  name: string;
  canUnmatch: boolean;
  onBlock: () => void;
  onReport: () => void;
  onUnmatch: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <Text style={styles.title}>Safety</Text>
      <MuteNote>{`Block, Report, or Un-match ${name} from Profile or chat.`}</MuteNote>
      <PrimaryButton title={`Block ${name}`} onPress={onBlock} />
      <GhostButton title={`Report ${name}`} onPress={onReport} />
      {canUnmatch ? <GhostButton title="Un-match" onPress={onUnmatch} /> : null}
      <GhostButton title="Not now" onPress={onClose} />
    </>
  );
}

export function SafetyBlock({
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

export function SafetyUnmatch({
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
      <Text style={styles.title}>{`Un-match ${name}?`}</Text>
      <MuteNote>They will leave Matches and chat. You may see each other in discovery again. This is not a Block.</MuteNote>
      <PrimaryButton title={busy ? 'Un-matching…' : 'Un-match'} onPress={onConfirm} />
      <GhostButton title="Back" onPress={onBack} />
    </>
  );
}

export function SafetyReport({
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
      <PrimaryButton title={busy ? 'Sending…' : 'Report'} onPress={onConfirm} />
      <GhostButton title="Back" onPress={onBack} />
    </>
  );
}

export async function runBlock(
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

export async function runUnmatch(
  token: string,
  matchId: string,
  busy: boolean,
  setBusy: (value: boolean) => void,
  onUnmatched: () => void,
) {
  if (busy) return;
  setBusy(true);
  const ok = await submitUnmatch(token, matchId);
  setBusy(false);
  if (ok && afterSafety('unmatch') === 'leave') onUnmatched();
}

export async function runReport(
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
  title: { fontFamily: font.display, fontSize: 24, fontWeight: '700', color: color.ink },
});
