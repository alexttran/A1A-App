import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, MIN_TOUCH_TARGET, spacing } from '@/theme';

import { Text } from './Text';

/**
 * A labelled value in a detail view. When `link` is given the row is tappable and
 * hands off to the OS — dialer, mail client, or map app (FR-DIR-8).
 */
export function FieldRow({
  icon,
  label,
  value,
  link,
  multiline = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  link?: { scheme: 'tel' | 'mailto' | 'map'; target: string };
  multiline?: boolean;
}) {
  const open = link
    ? () => {
        const url =
          link.scheme === 'map'
            ? `https://maps.google.com/?q=${encodeURIComponent(link.target)}`
            : `${link.scheme}:${link.target}`;
        void Linking.openURL(url);
      }
    : undefined;

  const content = (
    <>
      <Ionicons
        name={icon}
        size={18}
        color={link ? colors.primary : colors.textSubtle}
        style={styles.icon}
      />
      <View style={styles.copy}>
        <Text variant="micro" tone="subtle">
          {label.toUpperCase()}
        </Text>
        <Text
          variant="body"
          tone={link ? 'primary' : 'default'}
          numberOfLines={multiline ? undefined : 2}
        >
          {value}
        </Text>
      </View>
      {link ? <Ionicons name="open-outline" size={16} color={colors.textSubtle} /> : null}
    </>
  );

  if (!open) return <View style={styles.row}>{content}</View>;

  return (
    <Pressable
      onPress={open}
      accessibilityRole="link"
      accessibilityLabel={`${label}: ${value}`}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    minHeight: MIN_TOUCH_TARGET,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.lg,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  icon: { marginTop: 2 },
  copy: { flex: 1, gap: 1 },
});
