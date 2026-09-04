import { type ReactNode } from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View, Image } from 'react-native';
import { styles } from './kit.styles';
import { asText } from './mark';

export { Field } from './field';

export function Screen({
  children,
  footer,
}: {
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={styles.scroll}
      >
        {children}
      </ScrollView>
      {footer}
    </SafeAreaView>
  );
}

export function Hero({
  kicker,
  title,
  subtitle,
}: {
  kicker: string;
  title: string;
  subtitle: string;
}) {
  return (
    <View style={styles.hero}>
      <View style={styles.heroInner}>
        <View style={styles.mark}>
          <Text style={styles.markText}>{asText('♥')}</Text>
        </View>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

export function Sheet({ children }: { children: ReactNode }) {
  return <View style={styles.sheet}>{children}</View>;
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

export function PhotoCard({
  uri,
  photos,
  photoIndex = 0,
  name,
  age,
  place,
  bio,
  mark,
}: {
  uri?: string;
  photos?: string[];
  photoIndex?: number;
  name: string;
  age: number;
  place: string;
  bio?: string;
  mark?: string;
}) {
  const urls = photos?.length ? photos : uri ? [uri] : [];
  const shown = urls[photoIndex] ?? urls[0];
  return (
    <View style={styles.photoCard}>
      {shown ? (
        <Image
          source={{ uri: shown }}
          style={styles.photoFill}
          resizeMode="cover"
          accessibilityLabel={name}
        />
      ) : (
        <View style={styles.photoFallback}>
          <Text style={styles.portraitInitial}>{name.slice(0, 1).toUpperCase()}</Text>
        </View>
      )}
      {urls.length > 1 ? (
        <View style={styles.photoDots}>
          {urls.map((url, i) => (
            <View
              key={`${i}-${url}`}
              style={[styles.photoDot, i === photoIndex ? styles.photoDotOn : null]}
            />
          ))}
        </View>
      ) : null}
      <View style={styles.photoBadge}>
        <Text style={styles.photoBadgeText}>{place}</Text>
      </View>
      <View style={styles.photoCaption}>
        <Text style={styles.photoName}>{`${name}, ${age}`}</Text>
        {mark ? <Text style={styles.photoBio}>{mark}</Text> : null}
        {bio ? (
          <Text style={styles.photoBio} numberOfLines={1}>
            {bio}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

export function Portrait({ uri, name }: { uri?: string; name: string }) {
  if (uri) {
    return <Image source={{ uri }} style={styles.portrait} accessibilityLabel={name} />;
  }
  return (
    <View style={styles.portraitFallback} accessibilityLabel={name}>
      <Text style={styles.portraitInitial}>{name.slice(0, 1).toUpperCase()}</Text>
    </View>
  );
}

export function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.section}>{children}</Text>;
}

export function ChipRow({
  options,
  value,
  onChange,
  labels,
  multi,
  caption,
  readonly,
  nowrap,
}: {
  options: readonly string[];
  value: string | readonly string[];
  onChange?: (next: string) => void;
  labels?: Record<string, string>;
  multi?: boolean;
  caption?: string;
  readonly?: boolean;
  nowrap?: boolean;
}) {
  return (
    <View style={styles.chipBlock}>
      {caption ? <Text style={styles.fieldLabel}>{caption}</Text> : null}
      <View style={[styles.chips, nowrap ? styles.chipsNowrap : null]}>
        {options.map((option) => (
          <Chip
            key={option}
            label={labels?.[option] ?? option}
            on={
              multi ? (value as readonly string[]).includes(option) : value === option
            }
            readonly={readonly}
            onPress={() => onChange?.(option)}
          />
        ))}
      </View>
    </View>
  );
}

function Chip({
  label,
  on,
  readonly,
  onPress,
}: {
  label: string;
  on: boolean;
  readonly?: boolean;
  onPress: () => void;
}) {
  const look = [styles.chip, on ? styles.chipOn : styles.chipOff];
  const type = [styles.chipText, on ? styles.chipTextOn : styles.chipTextOff];
  if (readonly) {
    return (
      <View style={look}>
        <Text style={type}>{label}</Text>
      </View>
    );
  }
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: on }}
      accessibilityLabel={label}
      style={look}
    >
      <Text style={type}>{label}</Text>
    </Pressable>
  );
}

export function CheckRow({
  label,
  hint,
  on,
  onPress,
}: {
  label: string;
  hint?: string;
  on: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      style={[styles.check, on ? styles.checkOn : null]}
    >
      <View style={[styles.box, on ? styles.boxOn : null]}>
        {on ? <Text style={styles.tick}>{asText('✓')}</Text> : null}
      </View>
      <View style={styles.checkCopy}>
        <Text style={styles.checkLabel}>{label}</Text>
        {hint ? <Text style={styles.checkHint}>{hint}</Text> : null}
      </View>
    </Pressable>
  );
}

export function PrimaryButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.cta, pressed ? styles.ctaPressed : null]}
    >
      <Text style={styles.ctaText}>{title}</Text>
    </Pressable>
  );
}

export function GhostButton({ title, onPress }: { title: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={styles.ghost}>
      <Text style={styles.ghostText}>{title}</Text>
    </Pressable>
  );
}

export function MuteNote({ children }: { children: string }) {
  return <Text style={styles.muteNote}>{children}</Text>;
}

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}