import type { ReactNode } from 'react';
import { Image, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { languageLabel, color, font } from './theme';
import type { Profile } from './profile';
import { ChipRow, GhostButton, PrimaryButton, Screen, Sheet } from './ui/kit';
import { ActionRow } from './ui/deck';

export function PersonScreen({
  profile,
  onBack,
  onLike,
  onPass,
  onMessage,
  footer,
}: {
  profile: Profile;
  onBack: () => void;
  onLike?: () => void;
  onPass?: () => void;
  onMessage?: () => void;
  footer?: ReactNode;
}) {
  return (
    <Screen footer={footer}>
      <Sheet>
        <GhostButton title="Back" onPress={onBack} />
        <PhotoStrip profile={profile} />
        <Text style={styles.name}>
          {profile.firstName}, {profile.age}
        </Text>
        <Text style={styles.place}>{profile.city} · Republic of Cyprus</Text>
        <Text style={styles.bio}>{profile.bio}</Text>
        <ChipRow
          options={profile.languagesSpoken}
          value={profile.languagesSpoken}
          labels={languageLabel}
          multi
          readonly
        />
        {onMessage ? <PrimaryButton title={`Message ${profile.firstName}`} onPress={onMessage} /> : null}
        {onLike && onPass ? <ActionRow onPass={onPass} onLike={onLike} /> : null}
      </Sheet>
    </Screen>
  );
}

function PhotoStrip({ profile }: { profile: Profile }) {
  const photos = profile.photos;
  if (photos.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {photos.map((photo) => (
        <Image
          key={photo.photoId}
          source={{ uri: photo.url }}
          style={styles.shot}
          accessibilityLabel={profile.firstName}
        />
      ))}
    </ScrollView>
  );
}

export function ChatPerson({
  profile,
  onPress,
}: {
  profile: Profile;
  onPress: () => void;
}) {
  const uri = profile.photos[0]?.url;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${profile.firstName} profile`}
      style={styles.person}
    >
      {uri ? (
        <Image source={{ uri }} style={styles.avatar} accessibilityLabel={profile.firstName} />
      ) : (
        <View style={styles.avatar} />
      )}
      <View style={styles.copy}>
        <Text style={styles.personName}>
          {profile.firstName}, {profile.age}
        </Text>
        <Text style={styles.personPlace}>{profile.city}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  name: { fontFamily: font.display, fontSize: 28, fontWeight: '700', color: color.ink },
  place: { fontFamily: font.body, fontSize: 15, color: color.mute, marginTop: -8 },
  bio: { fontFamily: font.body, fontSize: 16, lineHeight: 24, color: color.ink },
  shot: {
    width: 240,
    height: 320,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: color.surface,
  },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.surface },
  copy: { flex: 1 },
  personName: { fontFamily: font.display, fontSize: 18, fontWeight: '700', color: color.ink },
  personPlace: { fontFamily: font.body, fontSize: 13, color: color.mute, marginTop: 2 },
});
