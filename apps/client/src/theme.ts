import { Platform } from 'react-native';

export const color = {
  bg: '#FFFFFF',
  surface: '#F6F6F8',
  paper: '#FFFFFF',
  ink: '#1A1A1A',
  mute: '#8E8E93',
  line: '#EFEFF2',
  rose: '#E94057',
  rosePressed: '#C7364A',
  roseSoft: '#FDECEE',
  onRose: '#FFFFFF',
  overlay: 'rgba(18, 10, 16, 0.45)',
  danger: '#E94057',
};

const webSans = 'Urbanist, ui-sans-serif, system-ui, sans-serif';

export const font = {
  display: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: webSans }),
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: webSans }),
};

export const languageLabel: Record<string, string> = {
  en: 'English',
  uk: 'Ukrainian',
  ru: 'Russian',
  ro: 'Romanian',
  bg: 'Bulgarian',
};

export const genderLabel: Record<string, string> = {
  man: 'Man',
  woman: 'Woman',
};

export const seekingLabel: Record<string, string> = {
  men: 'Men',
  women: 'Women',
};

export function ensureWebFonts(): void {
  if (Platform.OS !== 'web' || typeof document === 'undefined') return;
  if (!document.getElementById('here-fonts')) {
    const link = document.createElement('link');
    link.id = 'here-fonts';
    link.rel = 'stylesheet';
    link.href =
      'https://fonts.googleapis.com/css2?family=Urbanist:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }
  if (document.getElementById('here-web-reset')) return;
  const reset = document.createElement('style');
  reset.id = 'here-web-reset';
  reset.textContent =
    'button{appearance:none;-webkit-appearance:none;background:transparent;border:0;margin:0;padding:0;font:inherit;color:inherit}' +
    'div[dir="auto"]{background-color:transparent!important}';
  document.head.appendChild(reset);
}
