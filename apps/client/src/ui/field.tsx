import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { color } from '../theme';
import { inputKeyboard, type InputKind } from './input';
import { styles } from './kit.styles';

export function Field({
  label,
  value,
  onChangeText,
  placeholder,
  kind = 'text',
  secure,
  autoCapitalize,
  multiline,
  returnKeyType,
  onSubmitEditing,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
  kind?: InputKind;
  secure?: boolean;
  autoCapitalize?: 'none' | 'sentences';
  multiline?: boolean;
  returnKeyType?: 'done' | 'go' | 'next';
  onSubmitEditing?: () => void;
}) {
  const keys = inputKeyboard(kind);
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={color.mute}
        keyboardType={keys.keyboardType}
        autoComplete={keys.autoComplete}
        textContentType={keys.textContentType}
        secureTextEntry={secure ?? keys.secureTextEntry}
        autoCapitalize={autoCapitalize ?? keys.autoCapitalize}
        autoCorrect={false}
        multiline={multiline}
        returnKeyType={returnKeyType}
        onSubmitEditing={onSubmitEditing}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[styles.input, multiline && styles.multiline, focused && styles.inputOn]}
      />
    </View>
  );
}
