import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, Text, StyleSheet } from 'react-native';
import { deckTap, nextPhotoIndex, swipeDecision } from '../match';
import type { Profile } from '../profile';
import { PhotoCard } from './kit';

const THRESHOLD = 110;

export function SwipeCard({
  card,
  onLike,
  onPass,
  onOpen,
}: {
  card: Profile;
  onLike: () => void;
  onPass: () => void;
  onOpen: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [width, setWidth] = useState(300);
  const [height, setHeight] = useState(400);
  const pan = useRef(new Animated.ValueXY()).current;
  const urls = card.photos.map((photo) => photo.url);

  useEffect(() => {
    setIndex(0);
    pan.setValue({ x: 0, y: 0 });
  }, [card.profileId, pan]);

  const responder = useMemo(
    () =>
      makeResponder(pan, width, height, THRESHOLD, onLike, onPass, onOpen, (step) => {
        setIndex((current) => nextPhotoIndex(current, urls.length || 1, step));
      }),
    [height, onLike, onOpen, onPass, pan, urls.length, width],
  );

  const rotate = pan.x.interpolate({
    inputRange: [-200, 0, 200],
    outputRange: ['-10deg', '0deg', '10deg'],
  });
  const likeOp = pan.x.interpolate({ inputRange: [40, 120], outputRange: [0, 1], extrapolate: 'clamp' });
  const passOp = pan.x.interpolate({ inputRange: [-120, -40], outputRange: [1, 0], extrapolate: 'clamp' });

  return (
    <Animated.View
      onLayout={(event) => {
        setWidth(event.nativeEvent.layout.width);
        setHeight(event.nativeEvent.layout.height);
      }}
      style={[styles.wrap, { transform: [{ translateX: pan.x }, { rotate }] }]}
      {...responder.panHandlers}
    >
      <PhotoCard
        photos={urls}
        photoIndex={index}
        name={card.firstName}
        age={card.age}
        place={card.city}
        bio={card.bio}
      />
      <Animated.View style={[styles.stamp, styles.like, { opacity: likeOp }]} pointerEvents="none">
        <Text style={styles.likeText}>LIKE</Text>
      </Animated.View>
      <Animated.View style={[styles.stamp, styles.nope, { opacity: passOp }]} pointerEvents="none">
        <Text style={styles.nopeText}>NOPE</Text>
      </Animated.View>
    </Animated.View>
  );
}

function makeResponder(
  pan: Animated.ValueXY,
  width: number,
  height: number,
  threshold: number,
  onLike: () => void,
  onPass: () => void,
  onOpen: () => void,
  onPhoto: (step: 1 | -1) => void,
) {
  return PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6,
    onPanResponderMove: Animated.event([null, { dx: pan.x }], { useNativeDriver: false }),
    onPanResponderRelease: (e, g) => {
      if (Math.abs(g.dx) < 12 && Math.abs(g.dy) < 12) {
        const kind = deckTap(e.nativeEvent.locationX, e.nativeEvent.locationY, width, height);
        if (kind === 'open') return onOpen();
        onPhoto(kind === 'photo-prev' ? -1 : 1);
        return;
      }
      const decision = swipeDecision(g.dx, threshold);
      if (decision === 'like') return fling(pan, 420, onLike);
      if (decision === 'pass') return fling(pan, -420, onPass);
      Animated.spring(pan, { toValue: { x: 0, y: 0 }, useNativeDriver: false }).start();
    },
  });
}

function fling(pan: Animated.ValueXY, x: number, then: () => void): void {
  Animated.timing(pan, { toValue: { x, y: 0 }, duration: 180, useNativeDriver: false }).start(() => {
    pan.setValue({ x: 0, y: 0 });
    then();
  });
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 0 },
  stamp: {
    position: 'absolute',
    top: 28,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 3,
    borderRadius: 8,
  },
  like: { left: 18, borderColor: '#2DD36F' },
  nope: { right: 18, borderColor: '#E94057' },
  likeText: { color: '#2DD36F', fontWeight: '800', fontSize: 22, letterSpacing: 1 },
  nopeText: { color: '#E94057', fontWeight: '800', fontSize: 22, letterSpacing: 1 },
});
