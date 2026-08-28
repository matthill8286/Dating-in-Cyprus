import { Writable } from 'node:stream';
import pino from 'pino';
import { describe, expect, it } from 'vitest';
import { loggerRedact } from './logger';

describe('logger redact', () => {
  it('does not write NFR-4 personal fields in a log line', () => {
    const chunks: Buffer[] = [];
    const stream = new Writable({
      write(chunk, _enc, cb) {
        chunks.push(Buffer.from(chunk));
        cb();
      },
    });
    const log = pino({ redact: loggerRedact }, stream);
    log.info({
      email: 'ada@example.com',
      phone: '+35799123456',
      name: 'Ada',
      password: 'password1',
      chatBody: 'hello there',
      photoUrl: 'https://photos.example/ada.jpg',
      req: { body: { email: 'ada@example.com', password: 'password1', mobile: '+35799123456' } },
    });
    const line = Buffer.concat(chunks).toString();
    expect(line).not.toContain('ada@example.com');
    expect(line).not.toContain('+35799123456');
    expect(line).not.toContain('Ada');
    expect(line).not.toContain('password1');
    expect(line).not.toContain('hello there');
    expect(line).not.toContain('https://photos.example/ada.jpg');
    expect(line).toContain('[redacted]');
  });
});
