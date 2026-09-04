import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { SESSION_KEY, type AsyncSessionStore } from './session';

/**
 * On a device the token belongs in the Keychain, not in memory: without this every app
 * launch is a fresh sign-in, and a persisted cache has nothing to unlock.
 */
export function secureSessionStore(): AsyncSessionStore | null {
  if (Platform.OS === 'web') return null;
  return {
    read: async () => {
      try {
        return await SecureStore.getItemAsync(SESSION_KEY);
      } catch {
        return null;
      }
    },
    write: async (token) => {
      try {
        if (token) await SecureStore.setItemAsync(SESSION_KEY, token);
        else await SecureStore.deleteItemAsync(SESSION_KEY);
      } catch {
        // A device with no Keychain access still works, just without a remembered session.
      }
    },
  };
}
