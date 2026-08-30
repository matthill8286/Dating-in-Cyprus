import { useState } from 'react';
import { Image, Pressable, SafeAreaView, Text, View, StyleSheet } from 'react-native';
import { nextPhotoIndex, photoTap } from './match';
import type { Profile } from './profile';
import { color, font } from './theme';

export function PhotoStory({
  profile,
  index,
  onIndex,
  onClose,
  onMessage,
}: {
  profile: Profile;
  index: number;
  onIndex: (index: number) => void;
  onClose: () => void;
  onMessage?: () => void;
}) {
  const [width, setWidth] = useState(300);
  const photos = profile.photos;
  const shown = photos[index] ?? photos[0];
  const count = photos.length || 1;

  return (
    <SafeAreaView style={styles.frame}>
      {shown ? (
        <Image source={{ uri: shown.url }} style={styles.fill} accessibilityLabel={profile.firstName} />
      ) : (
        <View style={styles.fill} />
      )}
      <Pressable
        style={styles.hit}
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        onPress={(event) => onIndex(nextPhotoIndex(index, count, photoTap(event.nativeEvent.locationX, width)))}
        accessibilityLabel="Change photo"
      />
      <StoryHeader profile={profile} index={index} onClose={onClose} />
      <View style={styles.bottom} pointerEvents="box-none">
        {photos.length > 1 ? (
          <View style={styles.thumbs}>
            {photos.map((photo, i) => (
              <Pressable key={photo.photoId} onPress={() => onIndex(i)} accessibilityLabel={`Photo ${i + 1}`}>
                <Image
                  source={{ uri: photo.url }}
                  style={[styles.thumb, i === index ? styles.thumbOn : null]}
                />
              </Pressable>
            ))}
          </View>
        ) : null}
        {onMessage ? (
          <Pressable onPress={onMessage} accessibilityRole="button" style={styles.composer}>
            <Text style={styles.hint}>Send message…</Text>
            <View style={styles.send}>
              <Text style={styles.sendMark}>➤</Text>
            </View>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function StoryHeader({
  profile,
  index,
  onClose,
}: {
  profile: Profile;
  index: number;
  onClose: () => void;
}) {
  return (
    <View style={styles.top} pointerEvents="box-none">
      <View style={styles.segments}>
        {profile.photos.map((photo, i) => (
          <View key={photo.photoId} style={[styles.seg, i === index ? styles.segOn : null]} />
        ))}
      </View>
      <View style={styles.bar}>
        {profile.photos[0]?.url ? (
          <Image source={{ uri: profile.photos[0].url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatar} />
        )}
        <Text style={styles.name}>{profile.firstName}</Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: { flex: 1, backgroundColor: '#111' },
  fill: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: '#111' },
  hit: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 1 },
  top: { position: 'absolute', left: 16, right: 16, top: 16, gap: 12, zIndex: 2 },
  segments: { flexDirection: 'row', gap: 4 },
  seg: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' },
  segOn: { backgroundColor: color.onRose },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: color.surface },
  name: { flex: 1, color: color.onRose, fontFamily: font.display, fontSize: 16, fontWeight: '700' },
  close: { color: color.onRose, fontSize: 18, fontWeight: '700', padding: 6 },
  bottom: { position: 'absolute', left: 16, right: 16, bottom: 24, gap: 12, zIndex: 2 },
  thumbs: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  thumb: { width: 44, height: 44, borderRadius: 8, backgroundColor: color.surface, opacity: 0.7 },
  thumbOn: { opacity: 1, borderWidth: 2, borderColor: color.onRose },
  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 22,
    paddingLeft: 16,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
  },
  hint: { flex: 1, color: color.onRose, fontFamily: font.body, fontSize: 15 },
  send: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.rose,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendMark: { color: color.onRose, fontSize: 14, fontWeight: '700' },
});
