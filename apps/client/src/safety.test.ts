import { describe, expect, it } from 'vitest';
import {
  afterSafety,
  REPORT_REASON_LABELS,
  REPORT_REASONS,
  safetyOnOwnProfile,
} from './safety';

describe('Block and Report', () => {
  it('names the four Report reasons from the glossary', () => {
    expect([...REPORT_REASONS]).toEqual(['fake', 'harassment', 'visitor', 'other']);
    expect(REPORT_REASON_LABELS.fake).toBe('Fake profile');
    expect(REPORT_REASON_LABELS.harassment).toBe('Harassment');
    expect(REPORT_REASON_LABELS.visitor).toBe('Visitor');
    expect(REPORT_REASON_LABELS.other).toBe('Other abuse');
  });

  it('leaves after a Block and stays after a Report', () => {
    expect(afterSafety('block')).toBe('leave');
    expect(afterSafety('report')).toBe('stay');
    expect(safetyOnOwnProfile(true)).toBe(false);
    expect(safetyOnOwnProfile(false)).toBe(true);
  });
});
