import { useState } from 'react';
import { GhostButton, MuteNote, PrimaryButton, SectionLabel } from './ui/kit';
import type { Profile } from './profile';
import {
  photoVerificationLabel,
  photoVerificationOf,
  submitPhotoVerification,
} from './verify';

export function VerifyCard({
  token,
  profile,
  onMark,
}: {
  token: string | null;
  profile: Profile;
  onMark: (profile: Profile) => void;
}) {
  const [busy, setBusy] = useState(false);
  const mark = photoVerificationLabel(photoVerificationOf(profile));

  async function run(skip: boolean) {
    if (!token || busy) return;
    setBusy(true);
    const next = await submitPhotoVerification(token, skip);
    setBusy(false);
    if (next) onMark({ ...profile, photoVerification: next });
  }

  return (
    <>
      <SectionLabel>Photo verification</SectionLabel>
      <MuteNote>{`${mark}. Optional. This is not a government ID check.`}</MuteNote>
      <PrimaryButton title={busy ? 'Checking…' : 'Verify photo'} onPress={() => void run(false)} />
      <GhostButton title="Skip" onPress={() => void run(true)} />
    </>
  );
}
