import type { HostLine } from './host';
import type { ProfileFormValues } from './profile';
import { OPERATING_AREA_CITIES, PROFILE_LANGUAGES } from './profile';

const LANGUAGE_NAME: Record<string, string> = {
  en: 'English',
  uk: 'Ukrainian',
  ru: 'Russian',
  ro: 'Romanian',
  bg: 'Bulgarian',
};

export type IntakeStep = 'name' | 'city' | 'languages' | 'bio';

export type IntakeState = {
  step: IntakeStep;
  form: ProfileFormValues;
  lines: HostLine[];
  done: boolean;
};

export const ASK_NAME = "I'm Here. What should people call you? First name only.";
export const ASK_CITY = 'Which city do you live in on the island?';
export const ASK_LANGUAGES = 'Which languages do you speak?';
export const ASK_BIO = "A few lines about you — I'll use your words, not invent any.";
export const INTAKE_READY = "That's enough to start. I'll introduce you to one person.";

const ASK: Record<IntakeStep, string> = {
  name: ASK_NAME,
  city: ASK_CITY,
  languages: ASK_LANGUAGES,
  bio: ASK_BIO,
};

export function startIntake(): IntakeState {
  return {
    step: 'name',
    form: { firstName: '', city: '', languagesSpoken: [], bio: '' },
    lines: [{ id: 'ask-name', kind: 'host', body: ASK_NAME }],
    done: false,
  };
}

export function parseFirstName(text: string): string | null {
  const word = text.trim().split(/\s+/)[0] ?? '';
  if (word.length < 1 || word.length > 40) return null;
  if (/[\d@.]/.test(word) || !/[A-Za-z\u0400-\u04FF]/.test(word)) return null;
  return word;
}

export function parseCity(text: string): string | null {
  const n = text.trim().toLowerCase();
  return (
    OPERATING_AREA_CITIES.find((city) => city.toLowerCase() === n) ??
    OPERATING_AREA_CITIES.find((city) => n.includes(city.toLowerCase())) ??
    null
  );
}

export function parseLanguages(text: string): string[] {
  const n = text.toLowerCase();
  return PROFILE_LANGUAGES.filter((code) => n.includes(code) || n.includes(LANGUAGE_NAME[code].toLowerCase()));
}

export function replyIntake(state: IntakeState, text: string): IntakeState {
  if (state.done) return state;
  if (state.step === 'name') return takeName(state, text);
  if (state.step === 'city') return takeCity(state, text);
  if (state.step === 'languages') return takeLanguages(state, text);
  return takeBio(state, text);
}

function takeName(state: IntakeState, text: string): IntakeState {
  const firstName = parseFirstName(text);
  if (!firstName) {
    return hostRetry(state, 'A first name only — no last name.');
  }
  return advance(state, firstName, { ...state.form, firstName }, 'city');
}

function takeCity(state: IntakeState, text: string): IntakeState {
  const city = parseCity(text);
  if (!city) {
    return hostRetry(state, 'Pick a city on the island — Limassol, Nicosia, Larnaca, Paphos, Paralimni, or Ayia Napa.');
  }
  return advance(state, city, { ...state.form, city }, 'languages');
}

function takeLanguages(state: IntakeState, text: string): IntakeState {
  const languagesSpoken = parseLanguages(text);
  if (languagesSpoken.length === 0) {
    return hostRetry(state, 'Tell me the languages you speak — English, Ukrainian, Russian, Romanian, or Bulgarian.');
  }
  return advance(state, spoken(languagesSpoken), { ...state.form, languagesSpoken }, 'bio');
}

function takeBio(state: IntakeState, text: string): IntakeState {
  const bio = text.trim();
  if (bio.length < 1 || bio.length > 280) {
    return hostRetry(state, 'A few lines is enough — under 280 characters, in your words.');
  }
  const form = { ...state.form, bio };
  return {
    step: 'bio',
    form,
    done: true,
    lines: [
      ...state.lines,
      { id: `you-bio`, kind: 'you', body: bio },
      { id: 'ready', kind: 'host', body: INTAKE_READY },
    ],
  };
}

function advance(
  state: IntakeState,
  you: string,
  form: ProfileFormValues,
  next: IntakeStep,
): IntakeState {
  return {
    step: next,
    form,
    done: false,
    lines: [
      ...state.lines,
      { id: `you-${state.step}`, kind: 'you', body: you },
      { id: `ask-${next}`, kind: 'host', body: ASK[next] },
    ],
  };
}

function hostRetry(state: IntakeState, body: string): IntakeState {
  return {
    ...state,
    lines: [...state.lines, { id: `retry-${state.lines.length}`, kind: 'host', body }],
  };
}

function spoken(codes: string[]): string {
  return codes.map((code) => LANGUAGE_NAME[code] ?? code).join(' · ');
}
