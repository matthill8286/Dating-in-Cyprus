import { Platform, type ViewStyle } from 'react-native';

/** Readable column on a wide browser. Phones use the full screen. */
export const WEB_COLUMN = 430;

export function pageOn(os: string): ViewStyle {
  if (os === 'web') return { width: '100%', maxWidth: WEB_COLUMN, alignSelf: 'center' };
  return { width: '100%' };
}

export const page: ViewStyle = pageOn(Platform.OS);
