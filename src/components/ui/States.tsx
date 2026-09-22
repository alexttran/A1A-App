import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radii, spacing } from '@/theme';

import { Button } from './Button';
import { Text } from './Text';

/**
 * Empty state. Deliberately invitational rather than apologetic — requirements
 * §8.4 and the Phase 2 notes both call out that an empty screen that looks broken
 * is how this app gets abandoned.
 */
export function EmptyState({
  icon,
  title,
  body,
  actionLabel,
  onAction,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.centered}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={26} color={colors.primary} />
      </View>
      <Text variant="heading" style={styles.center}>
        {title}
      </Text>
      <Text variant="body" tone="muted" style={styles.center}>
        {body}
      </Text>
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

/** NFR-7 — human-readable message plus a retry path. No raw error codes. */
export function ErrorState({
  title = 'Something went wrong',
  body,
  onRetry,
}: {
  title?: string;
  body: string;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.centered}>
      <View style={[styles.iconCircle, styles.iconCircleDanger]}>
        <Ionicons name="alert-circle-outline" size={26} color={colors.danger} />
      </View>
      <Text variant="heading" style={styles.center}>
        {title}
      </Text>
      <Text variant="body" tone="muted" style={styles.center}>
        {body}
      </Text>
      {onRetry ? (
        <Button label="Try again" variant="secondary" onPress={onRetry} style={styles.action} />
      ) : null}
    </View>
  );
}

/** NFR-2 — skeletons on every network read, never a blank screen. */
export function Skeleton({
  height = 16,
  width = '100%',
  radius = radii.sm,
}: {
  height?: number;
  width?: number | `${number}%`;
  radius?: number;
}) {
  return <View style={[styles.skeleton, { height, width, borderRadius: radius }]} />;
}

export function SkeletonCard() {
  return (
    <View style={styles.skeletonCard}>
      <Skeleton height={14} width="45%" />
      <Skeleton height={12} width="90%" />
      <Skeleton height={12} width="70%" />
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxxl + spacing.md,
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  center: { textAlign: 'center' },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  iconCircleDanger: { backgroundColor: colors.dangerSoft },
  action: { marginTop: spacing.md },
  skeleton: { backgroundColor: colors.surfaceSunken },
  skeletonCard: {
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
