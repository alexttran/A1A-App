import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { colors, MIN_TOUCH_TARGET, spacing } from '@/theme';

import { Text } from './Text';

export type HeaderAction = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
};

/**
 * Screen header. Used instead of the navigator's built-in header so every screen
 * gets the same title/subtitle treatment and the same 44pt actions.
 */
export function ScreenHeader({
  title,
  subtitle,
  onBack,
  showBack = false,
  actions = [],
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  showBack?: boolean;
  actions?: HeaderAction[];
}) {
  return (
    <View style={styles.header}>
      {showBack ? (
        <Pressable
          onPress={onBack ?? (() => router.back())}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
          style={styles.back}
        >
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </Pressable>
      ) : null}

      <View style={styles.titles}>
        <Text variant={showBack ? 'heading' : 'title'} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="caption" tone="subtle" numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {actions.map((action) => (
        <Pressable
          key={action.label}
          onPress={action.onPress}
          accessibilityRole="button"
          accessibilityLabel={action.label}
          hitSlop={8}
          style={styles.action}
        >
          <Ionicons
            name={action.icon}
            size={22}
            color={action.tone === 'danger' ? colors.danger : colors.primary}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  back: { width: 28, height: MIN_TOUCH_TARGET, justifyContent: 'center', marginLeft: -6 },
  titles: { flex: 1, gap: 1 },
  action: {
    width: MIN_TOUCH_TARGET,
    height: MIN_TOUCH_TARGET,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
