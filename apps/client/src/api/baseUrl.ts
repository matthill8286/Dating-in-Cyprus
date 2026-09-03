const LOCAL_API = 'http://localhost:8080';

export function apiBaseUrl(input: {
  isWeb?: boolean;
  envUrl?: string;
  packagerHost?: string;
}): string {
  if (!input.isWeb) {
    const host = input.packagerHost?.split(':')[0];
    if (host && isReachableDevHost(host)) {
      return `http://${host}:8080`;
    }
  }
  return input.envUrl?.trim() || LOCAL_API;
}

function isReachableDevHost(host: string): boolean {
  if (host === 'localhost' || host === '127.0.0.1') return false;
  return /^(?:\d{1,3}\.){3}\d{1,3}$|^[a-z0-9][a-z0-9.-]*[a-z0-9]$/i.test(host);
}

