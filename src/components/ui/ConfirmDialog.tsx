import { useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { colors, radii, shadow, spacing } from '@/theme';

import { Button } from './Button';
import { Input } from './Input';
import { Text } from './Text';

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  /**
   * When set, the confirm button stays disabled until the user types this string
   * exactly — required for deleting a non-empty folder (FR-DOC-10).
   */
  typeToConfirm?: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ visible, onCancel, ...rest }: ConfirmDialogProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      {/* Mounted only while open, so the typed-confirmation field starts empty on
          every open without resetting state from an effect. */}
      {visible ? <DialogBody onCancel={onCancel} {...rest} /> : null}
    </Modal>
  );
}

function DialogBody({
  title,
  body,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  typeToConfirm,
  onConfirm,
  onCancel,
}: Omit<ConfirmDialogProps, 'visible'>) {
  const [typed, setTyped] = useState('');
  const blocked = typeToConfirm !== undefined && typed.trim() !== typeToConfirm;

  return (
    <View style={styles.backdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} accessibilityLabel="Cancel" />
      <View style={styles.dialog} accessibilityViewIsModal accessibilityRole="alert">
        <Text variant="heading">{title}</Text>
        <Text variant="body" tone="muted">
          {body}
        </Text>

        {typeToConfirm !== undefined ? (
          <Input
            label={`Type "${typeToConfirm}" to confirm`}
            value={typed}
            onChangeText={setTyped}
            autoCapitalize="none"
            autoFocus
          />
        ) : null}

        <View style={styles.buttons}>
          <Button label={cancelLabel} variant="ghost" onPress={onCancel} style={styles.button} />
          <Button
            label={confirmLabel}
            variant={destructive ? 'danger' : 'primary'}
            onPress={onConfirm}
            disabled={blocked}
            style={styles.button}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  dialog: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.xl,
    gap: spacing.md,
    ...shadow.raised,
  },
  buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  button: { flex: 1 },
});
