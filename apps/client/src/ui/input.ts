export type InputKind = 'text' | 'email' | 'password' | 'phone';

export function inputKeyboard(kind: InputKind): {
  keyboardType: 'default' | 'email-address' | 'number-pad';
  autoComplete: 'off' | 'email' | 'password' | 'tel';
  textContentType: 'none' | 'emailAddress' | 'password' | 'telephoneNumber';
  autoCapitalize: 'none' | 'sentences';
  secureTextEntry: boolean;
} {
  if (kind === 'email') {
    return {
      keyboardType: 'email-address',
      autoComplete: 'email',
      textContentType: 'emailAddress',
      autoCapitalize: 'none',
      secureTextEntry: false,
    };
  }
  if (kind === 'password') {
    return {
      keyboardType: 'default',
      autoComplete: 'password',
      textContentType: 'password',
      autoCapitalize: 'none',
      secureTextEntry: true,
    };
  }
  if (kind === 'phone') {
    return {
      keyboardType: 'number-pad',
      autoComplete: 'tel',
      textContentType: 'telephoneNumber',
      autoCapitalize: 'none',
      secureTextEntry: false,
    };
  }
  return {
    keyboardType: 'default',
    autoComplete: 'off',
    textContentType: 'none',
    autoCapitalize: 'sentences',
    secureTextEntry: false,
  };
}
