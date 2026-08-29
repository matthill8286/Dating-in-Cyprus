import { Text, StyleSheet } from 'react-native';
import { useApp } from './context/AppContext';
import { color, font, languageLabel } from './theme';
import {
  ChipRow,
  GhostButton,
  Hero,
  Portrait,
  Screen,
  Sheet,
} from './ui/kit';
import { TabBar } from './ui/tabs';

export function ProfileViewScreen({
  onEdit,
  onPeople,
  onMatches,
}: {
  onEdit: () => void;
  onPeople?: () => void;
  onMatches?: () => void;
}) {
  const { profile } = useApp();
  if (!profile) return null;

  return (
    <Screen
      footer={
        onPeople && onMatches ? (
          <TabBar
            active="profile"
            onPeople={onPeople}
            onMatches={onMatches}
            onProfile={() => undefined}
          />
        ) : null
      }
    >
      <Hero
        kicker={profile.city}
        title={`${profile.firstName}, ${profile.age}`}
        subtitle="Republic of Cyprus"
      />
      <Sheet>
        <Portrait uri={profile.photos[0]?.url} name={profile.firstName} />
        <Text style={styles.bio}>{profile.bio}</Text>
        <ChipRow
          options={profile.languagesSpoken}
          value={profile.languagesSpoken}
          labels={languageLabel}
          multi
          readonly
        />
        <GhostButton title="Edit" onPress={onEdit} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  bio: {
    fontFamily: font.body,
    fontSize: 16,
    lineHeight: 24,
    color: color.ink,
  },
});
