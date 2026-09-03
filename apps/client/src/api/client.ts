import { NativeModules, Platform } from 'react-native';
import createClient from 'openapi-fetch';
import { apiBaseUrl } from './baseUrl';
import type { paths } from './schema';

const scriptURL = NativeModules.SourceCode?.scriptURL as string | undefined;
const packagerHost = scriptURL?.match(/^https?:\/\/([^/]+)/)?.[1];

export const api = createClient<paths>({
  baseUrl: apiBaseUrl({
    isWeb: Platform.OS === 'web',
    envUrl: process.env.EXPO_PUBLIC_API_BASE_URL,
    packagerHost,
  }),
});

