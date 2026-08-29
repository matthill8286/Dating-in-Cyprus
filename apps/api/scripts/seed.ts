import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PostgresAccountStore } from '../src/account/postgres';
import { hashPassword } from '../src/account/password';
import { loadConfig } from '../src/config';
import { applySeed, womenSeekingMen } from '../src/dev/seedPeople';
import { loadEnvFiles } from '../src/loadEnv';
import { PostgresLoopStore } from '../src/match/postgres';
import { PostgresProfileStore } from '../src/profile/postgres';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadEnvFiles([resolve(apiRoot, '.env.example'), resolve(apiRoot, '.env.local')]);

const config = loadConfig();
const accounts = new PostgresAccountStore(config.DATABASE_URL);
const profiles = new PostgresProfileStore(config.DATABASE_URL);
const loop = new PostgresLoopStore(config.DATABASE_URL);
const result = await applySeed(accounts, profiles, hashPassword, loop);
console.log(
  `Seed complete: ${result.created} created, ${result.reused} reused, ${result.inbound} inbound Interest, ${womenSeekingMen().length} women seeking men.`,
);
await accounts.close();
await profiles.close();
await loop.close();
