import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Banner, Button, Input, Text } from '@/components/ui';
import { useSession } from '@/stores/session';
import { colors, radii, spacing } from '@/theme';

/**
 * Login. Email and password only — there is no self-signup, accounts arrive by
 * admin invitation (requirements §2.3).
 */
export function LoginScreen() {
  const { signIn } = useSession();
  const [email, setEmail] = useState('dana.whitfield@a1asurgical.com');
  const [password, setPassword] = useState('prototype');
  const [submitting, setSubmitting] = useState(false);
  const [sentReset, setSentReset] = useState(false);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    setSubmitting(true);
    // Stands in for the auth round-trip so the button's busy state is reviewable.
    setTimeout(() => {
      setSubmitting(false);
      signIn(email);
    }, 450);
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <View style={styles.mark}>
            <Ionicons name="medical" size={28} color={colors.textInverse} />
          </View>
          <Text variant="display">A1A Field</Text>
          <Text variant="body" tone="muted" style={styles.center}>
            Hospitals, surgeons, and everything your team knows about them.
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            label="Work email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@a1asurgical.com"
            required
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            required
          />

          <Button
            label="Sign in"
            onPress={submit}
            disabled={!canSubmit}
            loading={submitting}
            fullWidth
          />
          <Button
            label="Forgot password?"
            variant="ghost"
            onPress={() => setSentReset(true)}
            fullWidth
          />

          {sentReset ? (
            <Banner
              tone="success"
              title="Reset link sent"
              body="Check your email for a link to set a new password. It expires in one hour."
              onDismiss={() => setSentReset(false)}
            />
          ) : null}
        </View>

        <View style={styles.foot}>
          <Text variant="caption" tone="subtle" style={styles.center}>
            Accounts are created by an A1A administrator. If you need access, ask Dana or Tom to
            send you an invitation.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface },
  content: {
    flexGrow: 1,
    padding: spacing.xl,
    paddingTop: spacing.xxxl + spacing.xl,
    gap: spacing.xxxl,
  },
  brand: { alignItems: 'center', gap: spacing.sm },
  mark: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  center: { textAlign: 'center' },
  form: { gap: spacing.md },
  foot: { marginTop: 'auto', paddingTop: spacing.xl },
});
