import type { Profile } from './profile';

export type InboxRow = {
  matchId: string;
  profile: Profile;
  lastMessage: { body: string; fromMe: boolean; sentAt: string } | null;
};

export function splitInbox(matches: InboxRow[]): { fresh: InboxRow[]; threads: InboxRow[] } {
  return {
    fresh: matches.filter((item) => !item.lastMessage),
    threads: matches.filter((item) => item.lastMessage),
  };
}

export function searchInbox(rows: InboxRow[], query: string): InboxRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => row.profile.firstName.toLowerCase().includes(needle));
}

export function bioHasMore(bio: string): boolean {
  return bio.length > 110;
}

export function nextPhotoIndex(current: number, count: number, step: 1 | -1): number {
  if (count <= 0) return 0;
  return (current + step + count) % count;
}

export const MATCH_SHEET_PAD = 40;
export const MATCH_GRID_GAP = 12;
export const MATCH_TILE_RATIO = 0.78;

export function matchGridWidth(windowWidth: number, columnCap = Number.POSITIVE_INFINITY): number {
  return Math.max(0, Math.min(windowWidth, columnCap) - MATCH_SHEET_PAD);
}

export function matchTileSize(
  gridWidth: number,
  gap = MATCH_GRID_GAP,
  ratio = MATCH_TILE_RATIO,
): { width: number; height: number } {
  if (gridWidth <= 0) return { width: 0, height: 0 };
  const width = Math.max(0, Math.floor((gridWidth - gap) / 2));
  return { width, height: Math.round(width / ratio) };
}

export function photoTap(x: number, width: number): 1 | -1 {
  return x < width * 0.35 ? -1 : 1;
}
