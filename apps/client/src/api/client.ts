import createClient from 'openapi-fetch';
import type { paths } from './schema';

const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
const baseUrl = typeof document !== 'undefined' ? 'http://localhost:8080' : envUrl;

export const api = createClient<paths>({ baseUrl });
