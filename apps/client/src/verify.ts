import { api } from './api/client';
import type { Profile } from './profile';

export type PhotoVerificationMark = 'unverified' | 'verified';

export function photoVerificationOf(
  profile: Pick<Profile, 'photoVerification'> | { photoVerification?: PhotoVerificationMark },
): PhotoVerificationMark {
  return profile.photoVerification ?? 'unverified';
}

export function photoVerificationLabel(mark: PhotoVerificationMark | undefined): string {
  return mark === 'verified' ? 'Photo verified' : 'Unverified';
}

export async function submitPhotoVerification(
  token: string,
  skip: boolean,
): Promise<PhotoVerificationMark | null> {
  const { data } = await api.POST('/v1/photo-verifications', {
    headers: { authorization: `Bearer ${token}` },
    body: skip ? { skip: true } : {},
  });
  return data?.photoVerification ?? null;
}
