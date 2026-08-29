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
  return last?.body ?? 'Say hello';
}

export function threadState(lines: ChatLine[]): 'empty' | 'populated' {
  return lines.length === 0 ? 'empty' : 'populated';
}
