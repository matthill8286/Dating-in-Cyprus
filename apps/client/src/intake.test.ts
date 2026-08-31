import { describe, expect, it } from 'vitest';
import {
  ASK_CITY,
  ASK_NAME,
  INTAKE_READY,
  parseCity,
  parseFirstName,
  parseLanguages,
  replyIntake,
  startIntake,
} from './intake';

describe('host intake', () => {
  it('opens as Here, not a Profile details form', () => {
    const start = startIntake();
    expect(start.lines[0]).toEqual({ id: 'ask-name', kind: 'host', body: ASK_NAME });
    expect(start.done).toBe(false);
    expect(JSON.stringify(start)).not.toMatch(/Confirm|Profile details/i);
  });

  it('walks first name, city, languages, and bio, then is ready to introduce', () => {
    expect(parseFirstName('Matthew Hill')).toBe('Matthew');
    expect(parseFirstName('')).toBeNull();
    expect(parseCity('I live in Limassol')).toBe('Limassol');
    expect(parseCity('Kyrenia')).toBeNull();
    expect(parseLanguages('English and Russian')).toEqual(['en', 'ru']);
    let state = startIntake();
    state = replyIntake(state, 'Matthew Hill');
    expect(state.form.firstName).toBe('Matthew');
    expect(state.lines.some((line) => line.kind === 'host' && line.body === ASK_CITY)).toBe(true);
    state = replyIntake(state, 'Limassol');
    state = replyIntake(state, 'English');
    state = replyIntake(state, 'Limassol harbour side. Here for the long run.');
    expect(state.done).toBe(true);
    expect(state.form).toMatchObject({
      firstName: 'Matthew',
      city: 'Limassol',
      languagesSpoken: ['en'],
      bio: 'Limassol harbour side. Here for the long run.',
    });
    expect(state.lines.at(-1)).toEqual({ id: 'ready', kind: 'host', body: INTAKE_READY });
  });

  it('stays on the step when the answer is not a fact Here can store', () => {
    let state = startIntake();
    state = replyIntake(state, '!!!');
    expect(state.step).toBe('name');
    expect(state.form.firstName).toBe('');
    state = replyIntake(state, 'Alex');
    state = replyIntake(state, 'Kyrenia');
    expect(state.step).toBe('city');
    expect(state.form.city).toBe('');
  });
});
