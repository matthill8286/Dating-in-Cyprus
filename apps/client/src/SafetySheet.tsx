import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { Modal, Pressable, Text, View, StyleSheet } from 'react-native';
import { keys } from './api/keys';
import { safetyOnOwnProfile, type ReportReason } from './safety';
import {
  runBlock,
  runReport,
  runUnmatch,
  SafetyBlock,
  SafetyMenu,
  SafetyReport,
  SafetyUnmatch,
} from './SafetySteps';
import { color, font } from './theme';

type Step = 'menu' | 'block' | 'report' | 'unmatch';

export function SafetySheet({
  name,
  profileId,
  matchId,
  token,
  onClose,
  onBlocked,
  onUnmatched,
}: {
  name: string;
  profileId: string;
  matchId?: string;
  token: string;
  onClose: () => void;
  onBlocked: () => void;
  onUnmatched?: () => void;
}) {
  const [step, setStep] = useState<Step>('menu');
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [busy, setBusy] = useState(false);
  const client = useQueryClient();

  /** Blocking or unmatching changes who Here may introduce and who is in the inbox. */
  const forgetThem = useCallback(
    (done: () => void) => () => {
      client.setQueryData(keys.intro(), null);
      void client.invalidateQueries({ queryKey: keys.intro() });
      void client.invalidateQueries({ queryKey: keys.matches() });
      void client.invalidateQueries({ queryKey: keys.pool() });
      if (matchId) client.removeQueries({ queryKey: keys.messages(matchId) });
      done();
    },
    [client, matchId],
  );

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.mask} accessibilityViewIsModal>
        <Pressable style={styles.dim} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.sheet}>
          {step === 'menu' ? (
            <SafetyMenu
              name={name}
              canUnmatch={Boolean(matchId)}
              onBlock={() => setStep('block')}
              onReport={() => setStep('report')}
              onUnmatch={() => setStep('unmatch')}
              onClose={onClose}
            />
          ) : null}
          {step === 'block' ? (
            <SafetyBlock
              name={name}
              busy={busy}
              onBack={() => setStep('menu')}
              onConfirm={() => void runBlock(token, profileId, busy, setBusy, forgetThem(onBlocked))}
            />
          ) : null}
          {step === 'unmatch' && matchId ? (
            <SafetyUnmatch
              name={name}
              busy={busy}
              onBack={() => setStep('menu')}
              onConfirm={() =>
                void runUnmatch(token, matchId, busy, setBusy, forgetThem(onUnmatched ?? onBlocked))
              }
            />
          ) : null}
          {step === 'report' ? (
            <SafetyReport
              reason={reason}
              busy={busy}
              onReason={(next) => setReason(next as ReportReason)}
              onBack={() => setStep('menu')}
              onConfirm={() => void runReport(token, profileId, reason, busy, setBusy, onClose)}
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
  matchId,
  token,
  onClose,
  onBlocked,
  onUnmatched,
}: {
  open: boolean;
  name: string;
  profileId: string;
  matchId?: string;
  token: string | null;
  onClose: () => void;
  onBlocked: () => void;
  onUnmatched?: () => void;
}) {
  if (!open || !token) return null;
  return (
    <SafetySheet
      name={name}
      profileId={profileId}
      matchId={matchId}
      token={token}
      onClose={onClose}
      onBlocked={onBlocked}
      onUnmatched={onUnmatched}
    />
  );
}

export function PersonSafety({
  own,
  name,
  profileId,
  matchId,
  token,
  onBlocked,
  onUnmatched,
}: {
  own: boolean;
  name: string;
  profileId: string;
  matchId?: string;
  token: string | null;
  onBlocked?: () => void;
  onUnmatched?: () => void;
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
        matchId={matchId}
        token={token}
        onClose={() => setOpen(false)}
        onBlocked={() => {
          setOpen(false);
          onBlocked?.();
        }}
        onUnmatched={() => {
          setOpen(false);
          onUnmatched?.();
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
  link: { color: color.rose, fontFamily: font.body, fontSize: 14, fontWeight: '700', marginTop: 16 },
});
