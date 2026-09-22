import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { colors, type as typeScale } from '@/theme';

export type TextVariant = keyof typeof typeScale;
export type TextTone =
  'default' | 'muted' | 'subtle' | 'inverse' | 'primary' | 'danger' | 'success' | 'warning';

const tones: Record<TextTone, string> = {
  default: colors.text,
  muted: colors.textMuted,
  subtle: colors.textSubtle,
  inverse: colors.textInverse,
  primary: colors.primary,
  danger: colors.danger,
  success: colors.success,
  warning: colors.warning,
};

export type TextProps = RNTextProps & {
  variant?: TextVariant;
  tone?: TextTone;
};

/**
 * The only text component in the app. Goes through the type scale so line
 * heights stay consistent, and inherits the OS dynamic-type setting rather than
 * capping it (NFR-6).
 */
export function Text({ variant = 'body', tone = 'default', style, ...rest }: TextProps) {
  const token = typeScale[variant];
  return (
    <RNText
      style={[
        {
          fontSize: token.fontSize,
          lineHeight: token.lineHeight,
          fontWeight: token.fontWeight,
          color: tones[tone],
        },
        style,
      ]}
      {...rest}
    />
  );
}
