import createClient from 'openapi-fetch';
import type { paths } from './schema';

const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export const api = createClient<paths>({ baseUrl });
