import { existsSync, readFileSync } from 'node:fs';

export function loadEnvFiles(paths: string[]): void {
  for (const file of paths) {
    if (!existsSync(file)) continue;
    const text = readFileSync(file, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eq = trimmed.indexOf('=');
      if (eq < 1) continue;
      const key = trimmed.slice(0, eq);
      const value = trimmed.slice(eq + 1);
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}
