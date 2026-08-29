import { describe, expect, it } from 'vitest';
import {
  appendLine,
  canSend,
  CHAT_POLL_MS,
  lastMessagePreview,
  threadPreview,
  threadState,
  type ChatLine,
} from './chat';

const hello: ChatLine = {
  messageId: '1',
  fromMe: true,
  body: 'Hello from Limassol',
  sentAt: '2026-08-28T12:00:00.000Z',
};

describe('chat thread', () => {
  it('starts empty and can send a trimmed message', () => {
    expect(threadState([])).toBe('empty');
    expect(threadPreview([])).toBe('Say hello');
    expect(canSend('')).toBe(false);
    expect(canSend('   ')).toBe(false);
    expect(canSend('Hi')).toBe(true);
    expect(canSend('x'.repeat(2001))).toBe(false);
    expect(CHAT_POLL_MS).toBe(4000);
    expect(lastMessagePreview(null)).toBe('Say hello');
    expect(lastMessagePreview({ body: 'Hi from Nicosia' })).toBe('Hi from Nicosia');
  });

  it('appends a sent line onto a populated thread', () => {
    const next = appendLine([], hello);
    expect(threadState(next)).toBe('populated');
    expect(threadPreview(next)).toBe('Hello from Limassol');
    expect(appendLine(next, { ...hello, messageId: '2', fromMe: false, body: 'Hi' })).toHaveLength(
      2,
    );
  });
});
