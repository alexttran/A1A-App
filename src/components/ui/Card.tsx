import { Pressable, StyleSheet, View, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radii, shadow, spacing } from '@/theme';

export type CardProps = ViewProps & {
  onPress?: () => void;
  padded?: boolean;
  accessibilityLabel?: string;
};

/** Surface container. Becomes a pressable row when `onPress` is supplied. */
export function Card({ onPress, padded = true, style, children, ...rest }: CardProps) {
  const base: ViewStyle[] = [styles.card, padded ? styles.padded : styles.flush];

  if (!onPress) {
    return (
      <View style={[...base, style]} {...rest}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [...base, pressed && styles.pressed, style as ViewStyle]}
      {...rest}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.card,
  },
  padded: { padding: spacing.lg },
  flush: { overflow: 'hidden' },
  pressed: { backgroundColor: colors.surfaceAlt },
});
