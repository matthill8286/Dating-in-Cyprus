import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PostgresAccountStore } from './account/postgres';
import { PostgresLoopStore } from './match/postgres';
import { PostgresProfileStore } from './profile/postgres';
import { PostgresPhotoVerificationStore } from './profile/verifyPostgres';
import { buildApp } from './app';
import { loadConfig } from './config';
import { loadEnvFiles } from './loadEnv';

const apiRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
loadEnvFiles([resolve(apiRoot, '.env.example'), resolve(apiRoot, '.env.local')]);

const config = loadConfig();
const accounts = new PostgresAccountStore(config.DATABASE_URL);
const profiles = new PostgresProfileStore(config.DATABASE_URL);
const loop = new PostgresLoopStore(config.DATABASE_URL);
const verifications = new PostgresPhotoVerificationStore(config.DATABASE_URL);
const app = await buildApp({ config, accounts, profiles, loop, verifications });

const shutdown = async (signal: string) => {
  app.log.info({ signal }, 'shutting down');
  await app.close();
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));

await app.listen({ port: config.PORT, host: '0.0.0.0' });
