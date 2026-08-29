import type { Account } from '../account/store';

export function accountsMatch(viewer: Account, other: Account): boolean {
  if (viewer.id === other.id) return false;
  const manMeetsWoman =
    viewer.gender === 'man' &&
    viewer.seeking === 'women' &&
    other.gender === 'woman' &&
    other.seeking === 'men';
  const womanMeetsMan =
    viewer.gender === 'woman' &&
    viewer.seeking === 'men' &&
    other.gender === 'man' &&
    other.seeking === 'women';
  return manMeetsWoman || womanMeetsMan;
}
