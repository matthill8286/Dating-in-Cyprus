import { Text, View, StyleSheet } from 'react-native';
import { PrimaryButton, Screen, Sheet } from './ui/kit';
import { color, font } from './theme';

/**
 * Shown when we hold a session but cannot read the Profile behind it. Without this a
 * signed-in Resident whose network is down is indistinguishable from one who never
 * finished intake, and would be walked through intake again for nothing.
 */
export function UnreachableScreen({ onRetry }: { onRetry: () => void }) {
  return (
    <Screen>
      <Sheet>
        <View style={styles.body}>
          <Text style={styles.title}>I cannot reach the island.</Text>
          <Text style={styles.lead}>
            You are still signed in. Check your connection and try again.
          </Text>
          <PrimaryButton title="Try again" onPress={onRetry} />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { gap: 16, paddingVertical: 24 },
  title: { color: color.ink, fontFamily: font.display, fontSize: 28 },
  lead: { color: color.mute, fontFamily: font.body, fontSize: 16, lineHeight: 24 },
});
