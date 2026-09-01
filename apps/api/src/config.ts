import { z } from 'zod';
import { isEuAzureRegion } from './region';

const DEFAULT_DEV_CORS = 'http://localhost:8081';

const euRegion = z.string().refine(isEuAzureRegion, {
  message: 'DATA_REGION and PHOTO_STORE_REGION must be an EU Azure region',
});

const configSchema = z.object({
  PORT: z.coerce.number().default(8080),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  CORS_ORIGINS: z
    .string()
    .transform((s) =>
      s
        .split(',')
        .map((o) => o.trim())
        .filter(Boolean),
    )
    .pipe(z.array(z.string()).min(1)),
  SESSION_SECRET: z.string().min(32),
  DATA_REGION: euRegion,
  PHOTO_STORE_REGION: euRegion,
  DATABASE_URL: z.string().min(1),
  HOST_MODEL_URL: z.string().optional(),
  HOST_MODEL_KEY: z.string().optional(),
  HOST_MODEL_NAME: z.string().optional(),
  HOST_MODEL_REGION: z.string().optional(),
});

export type Config = z.infer<typeof configSchema>;

function corsInput(env: NodeJS.ProcessEnv): string | undefined {
  const raw = env.CORS_ORIGINS?.trim();
  if (raw) return raw;
  if (env.NODE_ENV === 'production') return undefined;
  return DEFAULT_DEV_CORS;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = configSchema.safeParse({
    ...env,
    CORS_ORIGINS: corsInput(env),
  });
  if (!result.success) {
    throw new Error(`Invalid configuration: ${result.error.message}`);
  }
  return finalizeHostModel(result.data);
}

function blank(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function finalizeHostModel(cfg: Config): Config {
  const url = blank(cfg.HOST_MODEL_URL);
  const key = blank(cfg.HOST_MODEL_KEY);
  const name = blank(cfg.HOST_MODEL_NAME);
  const stated = blank(cfg.HOST_MODEL_REGION);
  if (!url) {
    return { ...cfg, HOST_MODEL_URL: undefined, HOST_MODEL_KEY: key, HOST_MODEL_NAME: name, HOST_MODEL_REGION: stated };
  }
  assertHttpsUrl(url);
  const region = stated ?? cfg.DATA_REGION;
  if (!isEuAzureRegion(region)) {
    throw new Error('Invalid configuration: HOST_MODEL_REGION must be an EU Azure region');
  }
  return { ...cfg, HOST_MODEL_URL: url, HOST_MODEL_KEY: key, HOST_MODEL_NAME: name, HOST_MODEL_REGION: region };
}

function assertHttpsUrl(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error('Invalid configuration: HOST_MODEL_URL must be an https URL');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Invalid configuration: HOST_MODEL_URL must be an https URL');
  }
}
