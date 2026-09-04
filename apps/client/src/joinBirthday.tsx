import { Pressable, Text, View, StyleSheet } from 'react-native';
import {
  birthdayLabel,
  isoDate,
  monthDays,
  parseIsoDate,
  shiftCalendarMonth,
  type JoinFormValues,
} from './join';
import { color, font } from './theme';
import { PrimaryButton } from './ui/kit';
import { asText } from './ui/mark';

export function BirthdayFields({
  form,
  setForm,
  picker,
  onToggle,
}: {
  form: JoinFormValues;
  setForm: (update: (current: JoinFormValues) => JoinFormValues) => void;
  picker: boolean;
  onToggle: () => void;
}) {
  const cursor = form.dateOfBirth || '2000-07-11';
  return (
    <>
      <Pressable onPress={onToggle} accessibilityRole="button" style={styles.dateBtn}>
        <Text style={styles.dateMark}>{asText('▦')}</Text>
        <Text style={styles.dateText}>{birthdayLabel(form.dateOfBirth)}</Text>
      </Pressable>
      {picker ? (
        <BirthdaySheet
          iso={cursor}
          onShift={(delta) =>
            setForm((current) => ({
              ...current,
              dateOfBirth: shiftCalendarMonth(current.dateOfBirth || '2000-07-11', delta),
            }))
          }
          onDay={(day) =>
            setForm((current) => {
              const parsed = parseIsoDate(current.dateOfBirth || '2000-07-11');
              if (!parsed) return current;
              return { ...current, dateOfBirth: isoDate(parsed.year, parsed.month, day) };
            })
          }
          onSave={onToggle}
        />
      ) : null}
    </>
  );
}

function BirthdaySheet({
  iso,
  onShift,
  onDay,
  onSave,
}: {
  iso: string;
  onShift: (delta: number) => void;
  onDay: (day: number) => void;
  onSave: () => void;
}) {
  const parsed = parseIsoDate(iso);
  return (
    <View style={styles.sheet}>
      <View style={styles.monthRow}>
        <Pressable onPress={() => onShift(-1)} accessibilityRole="button" accessibilityLabel="Previous month">
          <Text style={styles.chevron}>‹</Text>
        </Pressable>
        <Text style={styles.month}>{birthdayLabel(iso)}</Text>
        <Pressable onPress={() => onShift(1)} accessibilityRole="button" accessibilityLabel="Next month">
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </View>
      <View style={styles.grid}>
        {monthDays(iso).map((day, i) => (
          <Pressable
            key={`${iso}-${i}`}
            onPress={() => day && onDay(day)}
            style={[styles.cell, day && parsed?.day === day ? styles.cellOn : null]}
          >
            <Text style={[styles.cellText, day && parsed?.day === day ? styles.cellTextOn : null]}>
              {day ?? ''}
            </Text>
          </Pressable>
        ))}
      </View>
      <PrimaryButton title="Save" onPress={onSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: color.roseSoft,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  dateMark: { color: color.rose, fontSize: 18 },
  dateText: { fontFamily: font.body, fontSize: 15, fontWeight: '700', color: color.rose },
  sheet: {
    backgroundColor: color.paper,
    borderRadius: 20,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: color.line,
  },
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  month: { fontFamily: font.body, fontSize: 15, fontWeight: '700', color: color.rose },
  chevron: { fontSize: 28, color: color.rose, paddingHorizontal: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' },
  cellOn: { backgroundColor: color.rose, borderRadius: 20 },
  cellText: { fontFamily: font.body, fontSize: 14, color: color.ink },
  cellTextOn: { color: color.onRose, fontWeight: '700' },
});
