import { api } from './api/client';

export const REPORT_REASONS = ['fake', 'harassment', 'visitor', 'other'] as const;

export type ReportReason = (typeof REPORT_REASONS)[number];

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
  fake: 'Fake profile',
  harassment: 'Harassment',
  visitor: 'Visitor',
  other: 'Other abuse',
};

export type SafetyKind = 'block' | 'report' | 'unmatch';

export function afterSafety(kind: SafetyKind): 'leave' | 'stay' {
  return kind === 'report' ? 'stay' : 'leave';
}

export function safetyOnOwnProfile(own: boolean): boolean {
  return !own;
}

export async function submitBlock(token: string, profileId: string): Promise<boolean> {
  const { data } = await api.POST('/v1/blocks', {
    headers: { authorization: `Bearer ${token}` },
    body: { profileId },
  });
  return Boolean(data?.ok);
}

export async function submitReport(
  token: string,
  profileId: string,
  reason: ReportReason,
): Promise<boolean> {
  const { data } = await api.POST('/v1/reports', {
    headers: { authorization: `Bearer ${token}` },
    body: { profileId, reason },
  });
  return Boolean(data?.reportId);
}

export async function submitUnmatch(token: string, matchId: string): Promise<boolean> {
  const { data } = await api.DELETE('/v1/matches/{matchId}', {
    headers: { authorization: `Bearer ${token}` },
    params: { path: { matchId } },
  });
  return Boolean(data?.ok);
}
