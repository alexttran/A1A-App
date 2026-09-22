import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useSession } from '@/stores/session';
import { useUiPrefs } from '@/stores/uiPrefs';
import { colors, radii, spacing } from '@/theme';

import { Text } from './ui';

/** Phone geometry the prototype is designed against (iPhone 15 logical size). */
const PHONE_WIDTH = 393;
const PHONE_HEIGHT = 852;
const PANEL_WIDTH = 260;

/**
 * Web-only wrapper that presents the app at phone size, with a small panel of
 * prototype controls beside it.
 *
 * This exists because the reviewable artefact is a URL, but the product is a
 * portrait phone app (requirements §3) — reviewing the layout stretched across a
 * desktop window would give feedback on a layout that will never ship. On iOS and
 * Android this component renders its children and nothing else, so it costs the
 * real app nothing.
 */
export function DevicePreview({ children }: { children: ReactNode }) {
  const { width, height } = useWindowDimensions();

  if (Platform.OS !== 'web') return <>{children}</>;

  // A phone browser is already the right shape; framing it would only shrink it.
  const framed = width >= PHONE_WIDTH + PANEL_WIDTH + 96;
  if (!framed) return <>{children}</>;

  const phoneHeight = Math.min(PHONE_HEIGHT, height - 64);

  return (
    <View style={styles.stage}>
      <View style={[styles.bezel, { width: PHONE_WIDTH + 20, height: phoneHeight + 20 }]}>
        <View style={styles.viewport}>{children}</View>
      </View>
      <ControlPanel height={phoneHeight} />
    </View>
  );
}

function ControlPanel({ height }: { height: number }) {
  const { user, isAdmin, actAs } = useSession();
  const { isOffline, setOffline } = useUiPrefs();

  return (
    <View style={[styles.panel, { maxHeight: height }]}>
      <View style={styles.panelHeader}>
        <Text variant="bodyStrong" tone="inverse">
          A1A Field App
        </Text>
        <Text variant="caption" style={styles.panelDim}>
          Layout prototype · not wired to a backend
        </Text>
      </View>

      <View style={styles.panelBlock}>
        <Text variant="micro" style={styles.panelLabel}>
          VIEW AS
        </Text>
        <Text variant="caption" style={styles.panelDim}>
          The permission matrix in requirements §2.2 changes what appears on almost every screen.
          Switch roles to review both.
        </Text>
        <View style={styles.toggleRow}>
          <RoleButton label="Admin" active={isAdmin} onPress={() => actAs('admin')} />
          <RoleButton
            label="Standard"
            active={user !== null && !isAdmin}
            onPress={() => actAs('standard')}
          />
        </View>
        {user ? (
          <Text variant="caption" style={styles.panelDim}>
            Signed in as {user.fullName}
          </Text>
        ) : (
          <Text variant="caption" style={styles.panelDim}>
            Signed out — any password works.
          </Text>
        )}
      </View>

      <View style={styles.panelBlock}>
        <Text variant="micro" style={styles.panelLabel}>
          CONNECTION
        </Text>
        <Pressable
          onPress={() => setOffline(!isOffline)}
          accessibilityRole="switch"
          accessibilityState={{ checked: isOffline }}
          style={styles.switchRow}
        >
          <Ionicons
            name={isOffline ? 'checkbox' : 'square-outline'}
            size={18}
            color={isOffline ? '#FDB022' : 'rgba(255,255,255,0.6)'}
          />
          <Text variant="caption" tone="inverse">
            Simulate offline
          </Text>
        </Pressable>
        <Text variant="caption" style={styles.panelDim}>
          Shows the non-blocking banner from requirements §3 on every screen.
        </Text>
      </View>

      <View style={styles.panelFooter}>
        <Text variant="caption" style={styles.panelDim}>
          Data is seeded in memory and resets on reload. Contains no PHI, by design (§1.4).
        </Text>
      </View>
    </View>
  );
}

function RoleButton({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[styles.roleButton, active && styles.roleButtonActive]}
    >
      <Text variant="label" style={active ? styles.roleTextActive : styles.roleText}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxxl,
    backgroundColor: '#111827',
    padding: spacing.xxl,
  },
  bezel: {
    backgroundColor: '#000000',
    borderRadius: 52,
    padding: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 20 },
  },
  viewport: {
    flex: 1,
    borderRadius: 42,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  panel: {
    width: PANEL_WIDTH,
    gap: spacing.xl,
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  panelHeader: { gap: 2 },
  panelBlock: { gap: spacing.sm },
  panelFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.14)',
    paddingTop: spacing.md,
  },
  panelLabel: { color: 'rgba(255,255,255,0.55)', letterSpacing: 0.6 },
  panelDim: { color: 'rgba(255,255,255,0.6)' },
  toggleRow: { flexDirection: 'row', gap: spacing.sm },
  roleButton: {
    flex: 1,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  roleButtonActive: { backgroundColor: colors.surface, borderColor: colors.surface },
  roleText: { color: 'rgba(255,255,255,0.75)' },
  roleTextActive: { color: colors.primary },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, minHeight: 32 },
});
