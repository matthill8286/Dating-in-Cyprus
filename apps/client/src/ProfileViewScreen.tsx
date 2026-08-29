import { Image, ScrollView, Text, StyleSheet } from 'react-native';
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
import { TabBar, type TabGo } from './ui/tabs';

export function ProfileViewScreen({
  onEdit,
  go,
}: {
  onEdit: () => void;
  go?: TabGo;
}) {
  const { profile } = useApp();
  if (!profile) return null;

  return (
    <Screen footer={go ? <TabBar active="profile" go={go} /> : null}>
      <Hero
        kicker={profile.city}
        title={`${profile.firstName}, ${profile.age}`}
        subtitle="Republic of Cyprus"
      />
      <Sheet>
        {profile.photos.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {profile.photos.map((photo) => (
              <Image
                key={photo.photoId}
                source={{ uri: photo.url }}
                style={styles.shot}
                accessibilityLabel={profile.firstName}
              />
            ))}
          </ScrollView>
        ) : (
          <Portrait uri={profile.photos[0]?.url} name={profile.firstName} />
        )}
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
  shot: {
    width: 220,
    height: 300,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: color.surface,
  },
});
