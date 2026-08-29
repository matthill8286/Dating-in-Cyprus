export const CHAT_POLL_MS = 4000;

export type ChatLine = {
  messageId: string;
  fromMe: boolean;
  body: string;
  sentAt: string;
};

export function canSend(body: string): boolean {
  const trimmed = body.trim();
  return trimmed.length > 0 && trimmed.length <= 2000;
}

export function appendLine(lines: ChatLine[], line: ChatLine): ChatLine[] {
  return [...lines, line];
}

export function threadPreview(lines: ChatLine[]): string {
  const last = lines[lines.length - 1];
  return lastMessagePreview(last);
}

export function lastMessagePreview(last: { body: string } | null | undefined): string {
  return last?.body ?? 'Say hello';
}

export function messageClock(iso: string | undefined): string {
  if (!iso) return '';
  const when = new Date(iso);
  if (Number.isNaN(when.getTime())) return '';
  return when.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

export function threadState(lines: ChatLine[]): 'empty' | 'populated' {
  return lines.length === 0 ? 'empty' : 'populated';
}
