import { describe, expect, it } from 'vitest';
import { apiBaseUrl } from './baseUrl';

describe('api base url', () => {
  it('follows the Metro host so a phone on the same network reaches Docker via the API', () => {
    expect(
      apiBaseUrl({ envUrl: 'http://localhost:8080', packagerHost: '172.20.10.3:8081' }),
    ).toBe('http://172.20.10.3:8080');
  });

  it('uses EXPO_PUBLIC_API_BASE_URL when Metro is not running, as in a published build', () => {
    expect(apiBaseUrl({ envUrl: 'https://here.trycloudflare.com' })).toBe(
      'https://here.trycloudflare.com',
    );
  });

  it('lets web use a published API URL, and localhost when none is set', () => {
    expect(apiBaseUrl({ isWeb: true, envUrl: 'https://api.here.cy' })).toBe('https://api.here.cy');
    expect(apiBaseUrl({ isWeb: true })).toBe('http://localhost:8080');
  });
});
