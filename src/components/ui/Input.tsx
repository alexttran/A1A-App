import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { colors, MIN_TOUCH_TARGET, radii, spacing, type as typeScale } from '@/theme';

import { Text } from './Text';

export type InputProps = Omit<TextInputProps, 'style'> & {
  label?: string;
  hint?: string;
  error?: string;
  /** Renders a live "123 / 140" counter — every free-text field has a cap. */
  maxLength?: number;
  showCounter?: boolean;
  multiline?: boolean;
  minHeight?: number;
  required?: boolean;
};

export function Input({
  label,
  hint,
  error,
  maxLength,
  showCounter = false,
  multiline = false,
  minHeight,
  required = false,
  value,
  ...rest
}: InputProps) {
  const [focused, setFocused] = useState(false);
  const length = typeof value === 'string' ? value.length : 0;
  const nearLimit = maxLength !== undefined && length > maxLength * 0.9;

  return (
    <View style={styles.group}>
      {label ? (
        <View style={styles.labelRow}>
          <Text variant="label" tone="muted">
            {label}
            {required ? ' *' : ''}
          </Text>
          {showCounter && maxLength !== undefined ? (
            <Text variant="caption" tone={nearLimit ? 'warning' : 'subtle'}>
              {length} / {maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}

      <TextInput
        value={value}
        maxLength={maxLength}
        multiline={multiline}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={colors.textSubtle}
        accessibilityLabel={label}
        style={[
          styles.input,
          multiline && styles.multiline,
          minHeight !== undefined && { minHeight },
          focused && styles.focused,
          error !== undefined && styles.errored,
        ]}
        {...rest}
      />

      {error !== undefined ? (
        <Text variant="caption" tone="danger">
          {error}
        </Text>
      ) : hint ? (
        <Text variant="caption" tone="subtle">
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.xs },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth * 2,
    borderColor: colors.borderStrong,
    borderRadius: radii.md,
    color: colors.text,
    fontSize: typeScale.body.fontSize,
    lineHeight: typeScale.body.lineHeight,
  },
  multiline: { minHeight: 120, textAlignVertical: 'top', paddingTop: spacing.md },
  focused: { borderColor: colors.primary },
  errored: { borderColor: colors.danger },
});
