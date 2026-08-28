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
  return result.data;
}
