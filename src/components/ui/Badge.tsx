import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const palette: Record<BadgeTone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceSunken, fg: colors.textMuted },
  primary: { bg: colors.primarySoft, fg: colors.primary },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  danger: { bg: colors.dangerSoft, fg: colors.danger },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const { bg, fg } = palette[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text variant="micro" style={{ color: fg }}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

/**
 * Category marker. Colour plus a text label, never colour alone — NFR-6 is
 * explicit that category colours are not the only signal.
 */
export function CategoryBadge({ name, colorHex }: { name: string; colorHex: string }) {
  return (
    <View style={styles.category}>
      <View style={[styles.dot, { backgroundColor: colorHex }]} />
      <Text variant="micro" tone="muted">
        {name.toUpperCase()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.sm,
    alignSelf: 'flex-start',
  },
  category: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  dot: { width: 8, height: 8, borderRadius: radii.pill },
});
