import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, MIN_TOUCH_TARGET, radii, spacing } from '@/theme';

import { Text } from './Text';

export type ListRowProps = {
  title: string;
  subtitle?: string;
  meta?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconTone?: 'primary' | 'muted' | 'danger';
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
  titleLines?: number;
};

/** The standard tappable row: icon, two lines of text, optional trailing slot. */
export function ListRow({
  title,
  subtitle,
  meta,
  icon,
  iconTone = 'primary',
  leading,
  trailing,
  onPress,
  showChevron = true,
  titleLines = 1,
}: ListRowProps) {
  const content = (
    <>
      {leading ??
        (icon ? (
          <View style={[styles.iconWrap, iconTone === 'muted' && styles.iconWrapMuted]}>
            <Ionicons
              name={icon}
              size={18}
              color={
                iconTone === 'danger'
                  ? colors.danger
                  : iconTone === 'muted'
                    ? colors.textMuted
                    : colors.primary
              }
            />
          </View>
        ) : null)}

      <View style={styles.copy}>
        <Text variant="bodyStrong" numberOfLines={titleLines}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="muted" numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
        {meta ? (
          <Text variant="caption" tone="subtle" numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>

      {onPress && showChevron ? (
        <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={styles.row}>
        <View style={styles.pressArea}>{content}</View>
        {trailing}
      </View>
    );
  }

  // The trailing slot is a sibling of the pressable area, never a child of it.
  // A row that opens a detail screen often carries its own action button, and
  // nesting one button inside another is invalid markup and ambiguous to a
  // screen reader — the inner control becomes unreachable.
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
        style={({ pressed }) => [styles.pressArea, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
      {trailing}
    </View>
  );
}

export function Divider({ inset = false }: { inset?: boolean }) {
  return <View style={[styles.divider, inset && styles.dividerInset]} />;
}

/** A small all-caps label above a group of rows. */
export function SectionLabel({ children, trailing }: { children: string; trailing?: ReactNode }) {
  return (
    <View style={styles.sectionLabel}>
      <Text variant="micro" tone="subtle">
        {children.toUpperCase()}
      </Text>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: MIN_TOUCH_TARGET + 8,
    paddingRight: spacing.lg,
    backgroundColor: colors.surface,
  },
  pressArea: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET + 8,
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: spacing.md,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapMuted: { backgroundColor: colors.surfaceSunken },
  copy: { flex: 1, gap: 1 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
  dividerInset: { marginLeft: spacing.lg },
  sectionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
});
