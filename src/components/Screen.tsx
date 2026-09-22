import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type ViewStyle } from 'react-native';

import { useUiPrefs } from '@/stores/uiPrefs';
import { colors, spacing } from '@/theme';

import { Banner } from './ui';

export type ScreenProps = {
  children: ReactNode;
  /** Rendered above the scroll area and pinned — normally a <ScreenHeader />. */
  header?: ReactNode;
  /** Pinned below the scroll area — normally a primary action. */
  footer?: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  contentStyle?: ViewStyle;
};

/**
 * Standard screen frame: pinned header, scrolling body, pinned footer, and the
 * global offline banner.
 *
 * The banner sits here rather than in the root layout so it appears below each
 * screen's header instead of shoving the whole app down — requirements §3 asks
 * for a clear but non-blocking indicator.
 */
export function Screen({
  children,
  header,
  footer,
  scroll = true,
  padded = true,
  contentStyle,
}: ScreenProps) {
  const { isOffline } = useUiPrefs();

  const body = scroll ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[padded && styles.padded, styles.bottomRoom, contentStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, padded && styles.padded, contentStyle]}>{children}</View>
  );

  return (
    <View style={styles.screen}>
      {header}
      {isOffline ? (
        <View style={styles.bannerWrap}>
          <Banner
            tone="warning"
            title="You're offline"
            body="Showing the last loaded data. Changes can't be saved until the connection is back."
          />
        </View>
      ) : null}
      {body}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surfaceAlt },
  flex: { flex: 1 },
  padded: { padding: spacing.lg, gap: spacing.md },
  bottomRoom: { paddingBottom: spacing.xxxl },
  bannerWrap: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surfaceAlt,
  },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
