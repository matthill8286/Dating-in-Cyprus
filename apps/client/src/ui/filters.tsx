import { Pressable, Text, View, StyleSheet } from 'react-native';
import {
  AGE_BANDS,
  AGE_BAND_LABELS,
  CITY_FILTERS,
  CITY_FILTER_LABELS,
  type AgeBandId,
} from '../match';
import { color, font } from '../theme';
import { ChipRow, MuteNote, PrimaryButton } from './kit';

export function FilterSheet({
  city,
  ageBand,
  onCity,
  onAge,
  onDone,
}: {
  city: string;
  ageBand: AgeBandId;
  onCity: (city: string) => void;
  onAge: (id: AgeBandId) => void;
  onDone: () => void;
}) {
  return (
    <View style={styles.mask} accessibilityViewIsModal>
      <Pressable style={styles.dim} onPress={onDone} accessibilityLabel="Close filters" />
      <View style={styles.sheet}>
        <Text style={styles.title}>Filters</Text>
        <ChipRow
          caption="Location"
          options={CITY_FILTERS}
          value={city}
          onChange={onCity}
          labels={CITY_FILTER_LABELS}
        />
        <ChipRow
          caption="Age"
          options={AGE_BANDS.map((band) => band.id)}
          value={ageBand}
          onChange={(next) => onAge(next as AgeBandId)}
          labels={AGE_BAND_LABELS}
        />
        <MuteNote>City and age only. The map shows an approximate area, never a home.</MuteNote>
        <PrimaryButton title="Continue" onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mask: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'flex-end' },
  dim: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(18, 10, 16, 0.45)' },
  sheet: {
    backgroundColor: color.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    gap: 16,
  },
  title: { fontFamily: font.display, fontSize: 24, fontWeight: '700', color: color.ink },
});
