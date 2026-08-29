import { Text, View, StyleSheet } from 'react-native';
import { color, font } from './theme';
import { GhostButton, PrimaryButton, Screen, Sheet } from './ui/kit';

export function NotifyScreen({ onDone }: { onDone: () => void }) {
  return (
    <Screen>
      <Sheet>
        <View style={styles.top}>
          <View />
          <GhostButton title="Skip" onPress={onDone} />
        </View>
        <View style={styles.mark}>
          <Text style={styles.bubble}>♡</Text>
        </View>
        <Text style={styles.title}>Enable notifications</Text>
        <Text style={styles.subtitle}>
          Get a note when you Match or receive a message. Push delivery comes in a later slice.
        </Text>
        <PrimaryButton title="I want to be notified" onPress={onDone} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'flex-end' },
  mark: {
    width: 120,
    height: 120,
    borderRadius: 40,
    backgroundColor: color.roseSoft,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  bubble: { fontSize: 48, color: color.rose },
  title: {
    fontFamily: font.display,
    fontSize: 32,
    fontWeight: '700',
    color: color.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: font.body,
    fontSize: 15,
    lineHeight: 22,
    color: color.mute,
    textAlign: 'center',
  },
});
