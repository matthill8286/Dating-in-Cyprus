import type { ReactNode } from 'react';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View, StyleSheet } from 'react-native';
import { useApp } from './context/AppContext';
import { bioHasMore } from './match';
import { PhotoStory } from './PhotoStory';
import type { Profile, ProfilePhoto } from './profile';
import { PersonSafety } from './SafetySheet';
import { languageLabel, color, font } from './theme';
import { ActionRow, Fixed } from './ui/deck';
import { ChipRow } from './ui/kit';

export function PersonScreen({
  profile,
  onBack,
  onLike,
  onPass,
  onMessage,
  onEdit,
  onBlocked,
  footer,
}: {
  profile: Profile;
  onBack?: () => void;
  onLike?: () => void;
  onPass?: () => void;
  onMessage?: () => void;
  onEdit?: () => void;
  onBlocked?: () => void;
  footer?: ReactNode;
}) {
  const { sessionToken } = useApp();
  const [story, setStory] = useState<number | null>(null);
  const [openBio, setOpenBio] = useState(false);
  const own = Boolean(onEdit);
  if (story !== null) {
    return (
      <PhotoStory
        profile={profile}
        index={story}
        onIndex={setStory}
        onClose={() => setStory(null)}
        onMessage={onMessage}
      />
    );
  }

  return (
    <Fixed footer={footer}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <HeroPhoto
          profile={profile}
          onBack={onBack}
          onOpen={() => setStory(0)}
        />
        <View style={styles.card}>
          {onLike && onPass ? (
            <View style={styles.float}>
              <ActionRow onPass={onPass} onLike={onLike} />
            </View>
          ) : null}
          <PersonCopy
            profile={profile}
            openBio={openBio}
            onToggleBio={() => setOpenBio((value) => !value)}
            onMessage={onMessage}
            onEdit={onEdit}
          />
          <Gallery photos={profile.photos} name={profile.firstName} onOpen={setStory} />
          <PersonSafety
            own={own}
            name={profile.firstName}
            profileId={profile.profileId}
            token={sessionToken}
            onBlocked={onBlocked}
          />
        </View>
      </ScrollView>
    </Fixed>
  );
}

function HeroPhoto({
  profile,
  onBack,
  onOpen,
}: {
  profile: Profile;
  onBack?: () => void;
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
    </View>
  );
}

function PersonCopy({
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
            <Text style={styles.planeMark}>➤</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.section}>Location</Text>
      <Text style={styles.place}>{profile.city}</Text>
      <Text style={styles.country}>Republic of Cyprus</Text>
      <Text style={styles.section}>About</Text>
      <Text style={styles.bio} numberOfLines={openBio ? undefined : 2}>
        {profile.bio}
      </Text>
      {more ? (
        <Pressable onPress={onToggleBio} accessibilityRole="button">
          <Text style={styles.more}>{openBio ? 'Show less' : 'Read more'}</Text>
        </Pressable>
      ) : null}
      <Text style={styles.section}>Languages</Text>
      <ChipRow
        options={profile.languagesSpoken}
        value={profile.languagesSpoken}
        labels={languageLabel}
        multi
        readonly
      />
      {onEdit ? (
        <Pressable onPress={onEdit} accessibilityRole="button">
          <Text style={styles.more}>Edit</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Gallery({
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
          <Text style={styles.more}>See all</Text>
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
  scroll: { paddingBottom: 28 },
  hero: { width: '100%', height: 420, backgroundColor: color.surface },
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
  backMark: { color: color.rose, fontSize: 28, lineHeight: 30, fontWeight: '400' },
  card: {
    backgroundColor: color.paper,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -28,
    paddingTop: 20,
    paddingHorizontal: 20,
    gap: 8,
  },
  float: { marginTop: -58, marginBottom: 8 },
  copy: { gap: 6 },
  headline: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { flex: 1, fontFamily: font.display, fontSize: 28, fontWeight: '700', color: color.ink },
  plane: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: color.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planeMark: { color: color.onRose, fontSize: 16, fontWeight: '700' },
  section: { fontFamily: font.body, fontSize: 16, fontWeight: '700', color: color.ink, marginTop: 10 },
  place: { fontFamily: font.body, fontSize: 15, color: color.ink },
  country: { fontFamily: font.body, fontSize: 13, color: color.mute, marginTop: -4 },
  bio: { fontFamily: font.body, fontSize: 15, lineHeight: 22, color: color.ink },
  more: { color: color.rose, fontFamily: font.body, fontSize: 14, fontWeight: '700' },
  gallery: { gap: 10, marginTop: 8 },
  galleryHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tileLg: { width: '48%', aspectRatio: 1.1, borderRadius: 12, overflow: 'hidden' },
  tileSm: { width: '31%', aspectRatio: 1, borderRadius: 12, overflow: 'hidden' },
  tileFill: { width: '100%', height: '100%' },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  chatAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: color.surface },
  chatCopy: { flex: 1 },
  personName: { fontFamily: font.display, fontSize: 18, fontWeight: '700', color: color.ink },
  personPlace: { fontFamily: font.body, fontSize: 13, color: color.mute, marginTop: 2 },
});
