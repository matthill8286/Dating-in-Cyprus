import { Pressable, StyleSheet, Text, View } from 'react-native';
import { color, font } from '../theme';

export type MainTab = 'people' | 'matches' | 'profile';

const TABS: Array<{ id: MainTab; label: string; icon: string; iconOn: string }> = [
  { id: 'people', label: 'Discover', icon: '▣', iconOn: '▣' },
  { id: 'matches', label: 'Matches', icon: '♡', iconOn: '♥' },
  { id: 'profile', label: 'Profile', icon: '☺', iconOn: '☺' },
];

export function TabBar({
  active,
  onPeople,
  onMatches,
  onProfile,
}: {
  active: MainTab;
  onPeople: () => void;
  onMatches: () => void;
  onProfile: () => void;
}) {
  const go: Record<MainTab, () => void> = {
    people: onPeople,
    matches: onMatches,
    profile: onProfile,
  };
  return (
    <View style={styles.tabBar}>
      {TABS.map((tab) => (
        <TabItem
          key={tab.id}
          label={tab.label}
          icon={active === tab.id ? tab.iconOn : tab.icon}
          on={active === tab.id}
          onPress={go[tab.id]}
        />
      ))}
    </View>
  );
}

function TabItem({
  label,
  icon,
  on,
  onPress,
}: {
  label: string;
  icon: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="tab" style={styles.tabItem}>
      <Text style={[styles.tabIcon, on && styles.tabIconOn]}>{icon}</Text>
      <Text style={[styles.tabLabel, on && styles.tabLabelOn]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: color.paper,
    paddingTop: 10,
    paddingBottom: 14,
    shadowColor: '#1A1A1A',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 4, gap: 2 },
  tabLabel: { fontFamily: font.body, fontSize: 11, fontWeight: '600', color: color.mute },
  tabLabelOn: { color: color.rose },
  tabIcon: { fontSize: 22, color: color.mute, lineHeight: 26 },
  tabIconOn: { color: color.rose },
});
