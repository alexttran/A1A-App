import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/theme';

import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'md' | 'sm';

export type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
}: ButtonProps) {
  const inert = disabled || loading;
  const fg = foreground(variant, inert);

  return (
    <Pressable
      onPress={onPress}
      disabled={inert}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inert, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        size === 'sm' && styles.sm,
        background(variant, inert, pressed),
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={fg} />
      ) : (
        <View style={styles.content}>
          {icon ? <Ionicons name={icon} size={size === 'sm' ? 15 : 17} color={fg} /> : null}
          <Text variant={size === 'sm' ? 'label' : 'bodyStrong'} style={{ color: fg }}>
            {label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function foreground(variant: ButtonVariant, inert: boolean): string {
  if (inert) return colors.textSubtle;
  if (variant === 'primary') return colors.textInverse;
  if (variant === 'danger') return colors.danger;
  return colors.primary;
}

function background(variant: ButtonVariant, inert: boolean, pressed: boolean): ViewStyle {
  if (inert) return { backgroundColor: colors.surfaceSunken, borderColor: colors.border };
  switch (variant) {
    case 'primary':
      return {
        backgroundColor: pressed ? colors.primaryPressed : colors.primary,
        borderColor: pressed ? colors.primaryPressed : colors.primary,
      };
    case 'secondary':
      return {
        backgroundColor: pressed ? colors.primarySoft : colors.surface,
        borderColor: colors.primaryBorder,
      };
    case 'danger':
      return {
        backgroundColor: pressed ? colors.dangerSoft : colors.surface,
        borderColor: colors.danger,
      };
    case 'ghost':
      return {
        backgroundColor: pressed ? colors.primarySoft : 'transparent',
        borderColor: 'transparent',
      };
  }
}

const styles = StyleSheet.create({
  base: {
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sm: { minHeight: 34, paddingHorizontal: spacing.md, borderRadius: radii.sm },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  fullWidth: { alignSelf: 'stretch' },
});
