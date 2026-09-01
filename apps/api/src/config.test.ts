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

  it('accepts an https host model url in an EU region and ignores a blank url', () => {
    const live = loadConfig({
      ...valid,
      HOST_MODEL_URL: 'https://eastus.openai.azure.com/openai/deployments/x',
      HOST_MODEL_KEY: ' k ',
      HOST_MODEL_NAME: 'gpt-4o-mini',
    });
    expect(live.HOST_MODEL_URL).toMatch(/^https:/);
    expect(live.HOST_MODEL_REGION).toBe('westeurope');
    expect(live.HOST_MODEL_KEY).toBe('k');
    expect(loadConfig({ ...valid, HOST_MODEL_URL: '  ' }).HOST_MODEL_URL).toBeUndefined();
  });

  it('refuses a non-https host model url or a non-EU model region', () => {
    expect(() =>
      loadConfig({ ...valid, HOST_MODEL_URL: 'http://example.openai.azure.com/foo' }),
    ).toThrow(/HOST_MODEL_URL/);
    expect(() => loadConfig({ ...valid, HOST_MODEL_URL: 'not-a-url' })).toThrow(/HOST_MODEL_URL/);
    expect(() =>
      loadConfig({
        ...valid,
        HOST_MODEL_URL: 'https://example.openai.azure.com/foo',
        HOST_MODEL_REGION: 'eastus',
      }),
    ).toThrow(/HOST_MODEL_REGION/);
  });
});
