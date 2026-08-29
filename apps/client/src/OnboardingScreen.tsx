import { useMemo, useState } from 'react';
import { Animated, Image, PanResponder, Pressable, Text, View, StyleSheet } from 'react-native';
import {
  clampSlide,
  ONBOARDING_PHOTOS,
  ONBOARDING_SLIDES,
  onboardingSwipe,
} from './onboarding';
import { color, font } from './theme';
import { PrimaryButton } from './ui/kit';
import { Fixed } from './ui/deck';

export function OnboardingScreen({
  onCreate,
  onSignIn,
}: {
  onCreate: () => void;
  onSignIn: () => void;
}) {
  const [index, setIndex] = useState(0);
  const slide = ONBOARDING_SLIDES[clampSlide(index)];

  return (
    <Fixed>
      <View style={styles.page}>
        <PhotoPeek
          index={index}
          onSwipe={(dir) => setIndex((current) => clampSlide(current + (dir === 'next' ? 1 : -1)))}
        />
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
        <View style={styles.dots}>
          {ONBOARDING_SLIDES.map((item, i) => (
            <Pressable
              key={item.title}
              onPress={() => setIndex(i)}
              accessibilityRole="button"
              accessibilityLabel={item.title}
              style={[styles.dot, i === index ? styles.dotOn : null]}
            />
          ))}
        </View>
        <View style={styles.actions}>
          <PrimaryButton title="Create an account" onPress={onCreate} />
          <Pressable onPress={onSignIn} accessibilityRole="button" style={styles.signIn}>
            <Text style={styles.signInMute}>Already have an account? </Text>
            <Text style={styles.signInLink}>Sign In</Text>
          </Pressable>
        </View>
      </View>
    </Fixed>
  );
}

function PhotoPeek({
  index,
  onSwipe,
}: {
  index: number;
  onSwipe: (dir: 'next' | 'prev') => void;
}) {
  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8,
        onPanResponderRelease: (_e, g) => {
          const dir = onboardingSwipe(g.dx);
          if (dir) onSwipe(dir);
        },
      }),
    [onSwipe],
  );

  return (
    <Animated.View style={styles.stage} {...responder.panHandlers}>
      {ONBOARDING_PHOTOS.map((uri, i) => {
        const offset = i - index;
        return (
          <Image
            key={uri}
            source={{ uri }}
            accessibilityLabel={ONBOARDING_SLIDES[i]?.title ?? 'Portrait'}
            style={[
              styles.shot,
              {
                zIndex: 3 - Math.abs(offset),
                opacity: Math.abs(offset) > 1 ? 0 : offset === 0 ? 1 : 0.65,
                transform: [{ translateX: offset * 78 }, { scale: offset === 0 ? 1 : 0.84 }],
              },
            ]}
          />
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    width: '100%',
    maxWidth: 430,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  stage: {
    height: 360,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  shot: {
    position: 'absolute',
    width: 220,
    height: 320,
    borderRadius: 24,
    backgroundColor: color.surface,
  },
  title: {
    color: color.rose,
    fontFamily: font.display,
    fontSize: 36,
    fontWeight: '700',
    textAlign: 'center',
  },
  body: {
    color: color.mute,
    fontFamily: font.body,
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginTop: 8,
    minHeight: 72,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 12 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: color.line },
  dotOn: { backgroundColor: color.rose, width: 18 },
  actions: { marginTop: 'auto', gap: 8, paddingTop: 16 },
  signIn: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 10 },
  signInMute: { fontFamily: font.body, fontSize: 15, color: color.mute },
  signInLink: { fontFamily: font.body, fontSize: 15, fontWeight: '700', color: color.rose },
});
