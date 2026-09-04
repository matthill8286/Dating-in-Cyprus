/**
 * iOS treats several “text” symbols as emoji (a smiling face, a black heart, an envelope).
 * Variation Selector-15 forces text presentation so the mark stays a geometric glyph.
 */
const TEXT = '\uFE0E';

export function asText(glyph: string): string {
  return glyph.endsWith(TEXT) ? glyph : `${glyph}${TEXT}`;
}
