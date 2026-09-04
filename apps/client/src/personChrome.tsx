import { Image, Pressable, Text, View, StyleSheet } from 'react-native';
import { bioHasMore } from './match';
import type { Profile, ProfilePhoto } from './profile';
import { languageLabel, color, font } from './theme';
import { photoVerificationLabel, photoVerificationOf } from './verify';
import { ChipRow } from './ui/kit';
import { asText } from './ui/mark';

export function HeroPhoto({
  profile,
  onBack,
  onMore,
  onOpen,
}: {
  profile: Profile;
  onBack?: () => void;
  onMore?: () => void;
  onOpen: () => void;
}) {
  const uri = profile.photos[0]?.url;
  return (
    <View>
      <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={`${profile.firstName} photos`}>
        {uri ? (
          <Image source={{ uri }} style={styles.hero} accessibilityLabel={profile.firstName} />
        ) : (
          <View style={[styles.hero, styles.heroEmpty]} />
        )}
      </Pressable>
      {onBack ? (
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={styles.back}>
          <Text style={styles.backMark}>‹</Text>
        </Pressable>
      ) : null}
      {onMore ? (
        <Pressable onPress={onMore} accessibilityRole="button" accessibilityLabel="More" style={styles.more}>
          <Text style={styles.moreMark}>⋯</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function PersonCopy({
  profile,
  openBio,
  onToggleBio,
  onMessage,
  onEdit,
}: {
  profile: Profile;
  openBio: boolean;
  onToggleBio: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
}) {
  const more = bioHasMore(profile.bio);
  return (
    <View style={styles.copy}>
      <View style={styles.headline}>
        <Text style={styles.name}>
          {profile.firstName}, {profile.age}
        </Text>
        {onMessage ? (
          <Pressable onPress={onMessage} accessibilityRole="button" accessibilityLabel={`Message ${profile.firstName}`} style={styles.plane}>
            <Text style={styles.planeMark}>{asText('➤')}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.verify}>{photoVerificationLabel(photoVerificationOf(profile))}</Text>
      <Text style={styles.section}>Location</Text>
      <Text style={styles.place}>{profile.city}</Text>
      <Text style={styles.country}>Republic of Cyprus</Text>
      <Text style={styles.section}>About</Text>
      <Text style={styles.bio} numberOfLines={openBio ? undefined : 2}>
        {profile.bio}
      </Text>
      {more ? (
        <Pressable onPress={onToggleBio} accessibilityRole="button">
          <Text style={styles.link}>{openBio ? 'Show less' : 'Read more'}</Text>
        </Pressable>
      ) : null}
      <Text style={styles.section}>Languages spoken</Text>
      <ChipRow
        options={profile.languagesSpoken}
        value={profile.languagesSpoken}
        labels={languageLabel}
        multi
        readonly
      />
      {onEdit ? (
        <Pressable onPress={onEdit} accessibilityRole="button">
          <Text style={styles.link}>Edit</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export function Gallery({
  photos,
  name,
  onOpen,
}: {
  photos: ProfilePhoto[];
  name: string;
  onOpen: (index: number) => void;
}) {
  if (photos.length === 0) return null;
  return (
    <View style={styles.gallery}>
      <View style={styles.galleryHead}>
        <Text style={styles.section}>Gallery</Text>
        <Pressable onPress={() => onOpen(0)} accessibilityRole="button">
          <Text style={styles.link}>See all</Text>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {photos.map((photo, i) => (
          <Pressable
            key={photo.photoId}
            onPress={() => onOpen(i)}
            accessibilityRole="button"
            accessibilityLabel={`${name} photo ${i + 1}`}
            style={i < 2 ? styles.tileLg : styles.tileSm}
          >
            <Image source={{ uri: photo.url }} style={styles.tileFill} />
          </Pressable>
        ))}
      </View>
    </View>
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
        <Image source={{ uri }} style={styles.chatAvatar} accessibilityLabel={profile.firstName} />
      ) : (
        <View style={styles.chatAvatar} />
      )}
      <View style={styles.chatCopy}>
        <Text style={styles.personName}>
          {profile.firstName}, {profile.age}
        </Text>
        <Text style={styles.personPlace}>{profile.city}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hero: { width: '100%', height: 460, backgroundColor: color.surface },
  heroEmpty: { backgroundColor: color.roseSoft },
  back: {
    position: 'absolute',
    top: 16,
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backMark: { color: color.mute, fontSize: 28, lineHeight: 30, fontWeight: '400' },
  more: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: color.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreMark: { color: color.ink, fontSize: 22, fontWeight: '700', lineHeight: 24 },
  copy: { gap: 6 },
  headline: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { flex: 1, fontFamily: font.display, fontSize: 28, fontWeight: '700', color: color.ink },
  plane: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.paper,
    borderWidth: 1,
    borderColor: color.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planeMark: { color: color.rose, fontSize: 16, fontWeight: '700' },
  verify: { fontFamily: font.body, fontSize: 13, fontWeight: '600', color: color.rose, marginTop: -2 },
  section: { fontFamily: font.body, fontSize: 13, fontWeight: '600', color: color.mute, marginTop: 10 },
  place: { fontFamily: font.body, fontSize: 15, color: color.ink },
  country: { fontFamily: font.body, fontSize: 13, color: color.mute, marginTop: -4 },
  bio: { fontFamily: font.body, fontSize: 15, lineHeight: 22, color: color.ink },
  link: { color: color.rose, fontFamily: font.body, fontSize: 14, fontWeight: '700' },
  gallery: { gap: 10, marginTop: 8 },
  galleryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tileLg: { width: '48%', aspectRatio: 0.78, borderRadius: 16, overflow: 'hidden' },
  tileSm: { width: '31%', aspectRatio: 0.85, borderRadius: 14, overflow: 'hidden' },
  tileFill: { width: '100%', height: '100%' },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  chatAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.surface },
  chatCopy: { flex: 1 },
  personName: { fontFamily: font.display, fontSize: 18, fontWeight: '700', color: color.ink },
  personPlace: { fontFamily: font.body, fontSize: 13, color: color.mute, marginTop: 2 },
});
