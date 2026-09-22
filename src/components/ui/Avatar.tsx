import { StyleSheet, View } from 'react-native';

import { initials } from '@/lib/format';
import { colors, radii } from '@/theme';

import { Text } from './Text';

/** Initials avatar. No photo uploads in v1, so initials are the whole identity. */
export function Avatar({ name, size = 34 }: { name: string; size?: number }) {
  return (
    <View
      style={[styles.avatar, { width: size, height: size, borderRadius: radii.pill }]}
      accessible={false}
    >
      <Text variant={size >= 40 ? 'label' : 'micro'} tone="primary">
        {initials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.primaryBorder,
  },
});
