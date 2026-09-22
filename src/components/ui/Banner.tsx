import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing } from '@/theme';

import { Text } from './Text';

export type BannerTone = 'info' | 'warning' | 'danger' | 'success';

const palette: Record<
  BannerTone,
  { bg: string; fg: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  info: { bg: colors.infoSoft, fg: colors.info, icon: 'information-circle-outline' },
  warning: { bg: colors.warningSoft, fg: colors.warning, icon: 'warning-outline' },
  danger: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle-outline' },
  success: { bg: colors.successSoft, fg: colors.success, icon: 'checkmark-circle-outline' },
};

export function Banner({
  tone = 'info',
  title,
  body,
  onDismiss,
}: {
  tone?: BannerTone;
  title?: string;
  body: string;
  onDismiss?: () => void;
}) {
  const { bg, fg, icon } = palette[tone];
  return (
    <View style={[styles.banner, { backgroundColor: bg }]} accessibilityRole="alert">
      <Ionicons name={icon} size={18} color={fg} style={styles.icon} />
      <View style={styles.copy}>
        {title ? (
          <Text variant="label" style={{ color: fg }}>
            {title}
          </Text>
        ) : null}
        <Text variant="caption" tone="muted">
          {body}
        </Text>
      </View>
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          hitSlop={10}
        >
          <Ionicons name="close" size={18} color={colors.textMuted} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.md,
  },
  icon: { marginTop: 1 },
  copy: { flex: 1, gap: 2 },
});
