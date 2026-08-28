import { describe, expect, it } from 'vitest';
import { loadConfig } from './config';

const valid = {
  SESSION_SECRET: 's'.repeat(32),
  DATA_REGION: 'westeurope',
  PHOTO_STORE_REGION: 'westeurope',
  DATABASE_URL: 'postgres://dating:dating@localhost:5432/dating',
};

describe('loadConfig', () => {
  it('accepts EU data and photo regions', () => {
    const cfg = loadConfig(valid);
    expect(cfg.DATA_REGION).toBe('westeurope');
    expect(cfg.PHOTO_STORE_REGION).toBe('westeurope');
  });

  it('refuses a non-EU data region', () => {
    expect(() => loadConfig({ ...valid, DATA_REGION: 'eastus' })).toThrow(/Invalid configuration/);
  });

  it('refuses a non-EU photo store region', () => {
    expect(() => loadConfig({ ...valid, PHOTO_STORE_REGION: 'eastus' })).toThrow(
      /Invalid configuration/,
    );
  });

  it('rejects a missing cors list in production', () => {
    expect(() =>
      loadConfig({
        ...valid,
        NODE_ENV: 'production',
      }),
    ).toThrow(/Invalid configuration/);
  });
});
