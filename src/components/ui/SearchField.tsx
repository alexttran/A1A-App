import { Pressable, StyleSheet, TextInput, View, type TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, MIN_TOUCH_TARGET, radii, spacing, type as typeScale } from '@/theme';

export function SearchField({
  value,
  onChangeText,
  placeholder = 'Search',
  accessibilityLabel,
}: {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  accessibilityLabel?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={17} color={colors.textSubtle} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSubtle}
        accessibilityLabel={accessibilityLabel ?? placeholder}
        autoCorrect={false}
        returnKeyType="search"
        style={[styles.input, NO_FOCUS_RING]}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          accessibilityRole="button"
          accessibilityLabel="Clear search"
          hitSlop={10}
        >
          <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * react-native-web draws a browser focus ring that does not match the design
 * system. `outlineStyle` is a web-only style extension and is not in the React
 * Native style types, so it is cast rather than declared in the StyleSheet.
 */
const NO_FOCUS_RING = { outlineStyle: 'none' } as unknown as TextStyle;

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceSunken,
    borderRadius: radii.md,
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: typeScale.body.fontSize,
    paddingVertical: spacing.sm,
  },
});
