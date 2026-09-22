import { Fragment } from 'react';
import { Linking } from 'react-native';

import { Text, type TextProps } from './Text';

const URL_PATTERN = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;

/**
 * Plain text with auto-detected, tappable URLs — FR-BB-5. Line breaks are
 * preserved because the source is plain text with no rich formatting in v1.
 */
export function LinkedText({
  children,
  ...rest
}: { children: string } & Omit<TextProps, 'children'>) {
  const parts = children.split(URL_PATTERN);

  return (
    <Text {...rest}>
      {parts.map((part, index) => {
        if (!URL_PATTERN.test(part)) return <Fragment key={index}>{part}</Fragment>;
        const href = part.startsWith('http') ? part : `https://${part}`;
        return (
          <Text
            key={index}
            tone="primary"
            accessibilityRole="link"
            onPress={() => void Linking.openURL(href)}
          >
            {part}
          </Text>
        );
      })}
    </Text>
  );
}
