import { asText } from './mark';

export type MainTab = 'people' | 'matches' | 'messages' | 'profile';

export const TABS: Array<{ id: MainTab; label: string; icon: string; iconOn: string }> = [
  { id: 'people', label: 'Here', icon: asText('◇'), iconOn: asText('◆') },
  { id: 'matches', label: 'Matches', icon: asText('♡'), iconOn: asText('♥') },
  { id: 'messages', label: 'Messages', icon: asText('✉'), iconOn: asText('✉') },
  { id: 'profile', label: 'Profile', icon: asText('○'), iconOn: asText('●') },
];
