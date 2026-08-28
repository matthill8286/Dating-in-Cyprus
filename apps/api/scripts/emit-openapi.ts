import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from '../src/app';
import { loadConfig } from '../src/config';

const config = loadConfig({
  CORS_ORIGINS: 'http://localhost:8081',
  SESSION_SECRET: 's'.repeat(32),
  NODE_ENV: 'test',
  DATA_REGION: 'westeurope',
  PHOTO_STORE_REGION: 'westeurope',
  DATABASE_URL: 'postgres://dating:dating@localhost:5432/dating',
});

const app = await buildApp({ config });
await app.ready();
const spec = app.swagger();
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'openapi.json');
writeFileSync(out, JSON.stringify(spec, null, 2));
await app.close();
