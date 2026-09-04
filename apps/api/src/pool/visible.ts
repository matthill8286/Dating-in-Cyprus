import type { Account, AccountStore } from '../account/store';
import type { LoopStore } from '../match/store';
import { presentProfile } from '../profile/present';
import type { Profile, ProfileStore } from '../profile/store';
import { accountsMatch } from './match';

export type PoolDeps = {
  accounts: AccountStore;
  profiles: ProfileStore;
  loop: LoopStore;
  now: () => Date;
};

export async function listVisibleProfiles(viewer: Account, opts: PoolDeps) {
  const [admitted, profiles, hidden] = await Promise.all([
    opts.accounts.listAdmitted(),
    opts.profiles.list(),
    opts.loop.hiddenIds(viewer.id),
  ]);
  const byAccount = new Map(profiles.map((profile) => [profile.accountId, profile]));
  return admitted.flatMap((other) => {
    if (hidden.has(other.id) || !accountsMatch(viewer, other)) return [];
    const profile = byAccount.get(other.id);
    if (!profile || profile.photos.length === 0) return [];
    return [presentProfile(profile, other, opts.now())];
  });
}

/**
 * Resolve one profile the viewer is allowed to see, without materialising the whole pool.
 * Two indexed reads plus the hidden-ids union, rather than every admitted account and profile.
 */
export async function visibleProfile(viewer: Account, profileId: string, opts: PoolDeps) {
  const target = await matchingTarget(viewer, profileId, opts);
  if (!target) return null;
  const hidden = await opts.loop.hiddenIds(viewer.id);
  if (hidden.has(target.account.id)) return null;
  return presentProfile(target.profile, target.account, opts.now());
}

export async function matchingTarget(
  viewer: Account,
  profileId: string,
  opts: { accounts: AccountStore; profiles: ProfileStore },
): Promise<{ profile: Profile; account: Account } | null> {
  const profile = await opts.profiles.findById(profileId);
  if (!profile || profile.accountId === viewer.id || profile.photos.length === 0) return null;
  const account = await opts.accounts.findById(profile.accountId);
  if (!account?.residentAdmitted) return null;
  if (!accountsMatch(viewer, account)) return null;
  return { profile, account };
}
