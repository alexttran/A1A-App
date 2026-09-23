import { useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import {
  Avatar,
  Badge,
  Card,
  ConfirmDialog,
  Divider,
  ListRow,
  ScreenHeader,
  SectionLabel,
  Text,
} from '@/components/ui';
import { dateMedium } from '@/lib/format';
import { useData } from '@/lib/mock/store';
import { useCurrentUser, useSession } from '@/stores/session';
import { useUiPrefs } from '@/stores/uiPrefs';
import { colors, radii, spacing } from '@/theme';

/** The fifth tab: profile, admin entry points, and the app-level settings. */
export function MoreScreen() {
  const db = useData();
  const me = useCurrentUser();
  const { isAdmin, signOut } = useSession();
  const { isOffline, setOffline } = useUiPrefs();
  const [confirmSignOut, setConfirmSignOut] = useState(false);

  return (
    <Screen padded={false} header={<ScreenHeader title="More" />}>
      <View style={styles.block}>
        <Card>
          <View style={styles.profile}>
            <Avatar name={me.fullName} size={52} />
            <View style={styles.profileCopy}>
              <Text variant="heading">{me.fullName}</Text>
              <Text variant="caption" tone="muted">
                {me.email}
              </Text>
              <View style={styles.profileBadges}>
                <Badge label={me.role} tone={isAdmin ? 'primary' : 'neutral'} />
                <Text variant="caption" tone="subtle">
                  Since {dateMedium(me.createdAt)}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </View>

      {isAdmin ? (
        <>
          <SectionLabel>Administration</SectionLabel>
          <View style={styles.block}>
            <View style={styles.rows}>
              <ListRow
                icon="people-outline"
                title="Users"
                subtitle={`${db.users.filter((u) => u.isActive).length} active accounts`}
                onPress={() => router.push('/admin/users')}
              />
              <Divider inset />
              <ListRow
                icon="color-palette-outline"
                title="Event categories"
                subtitle={`${db.eventCategories.filter((c) => c.isActive).length} active`}
                onPress={() => router.push('/admin/categories')}
              />
            </View>
          </View>
        </>
      ) : null}

      <SectionLabel>Preferences</SectionLabel>
      <View style={styles.block}>
        <Card padded={false}>
          <View style={styles.settingRow}>
            <View style={styles.settingCopy}>
              <Text variant="bodyStrong">Simulate offline</Text>
              <Text variant="caption" tone="muted">
                Shows the offline banner on every screen. Prototype only — the real app reads the
                device connection.
              </Text>
            </View>
            <Switch
              value={isOffline}
              onValueChange={setOffline}
              accessibilityLabel="Simulate offline"
              trackColor={{ true: colors.primary, false: colors.borderStrong }}
            />
          </View>
        </Card>
      </View>

      <SectionLabel>About</SectionLabel>
      <View style={styles.block}>
        <View style={styles.rows}>
          <ListRow
            icon="shield-checkmark-outline"
            title="No patient information"
            subtitle="This app holds business contacts only. It is not a clinical system and must never contain PHI."
            titleLines={2}
            showChevron={false}
          />
          <Divider inset />
          <ListRow
            icon="information-circle-outline"
            title="A1A Field App"
            subtitle="Version 0.1.0 · layout prototype"
            showChevron={false}
          />
        </View>
      </View>

      <View style={styles.block}>
        <View style={styles.rows}>
          <ListRow
            icon="log-out-outline"
            iconTone="danger"
            title="Sign out"
            onPress={() => setConfirmSignOut(true)}
            showChevron={false}
          />
        </View>
      </View>

      <Text variant="caption" tone="subtle" style={styles.foot}>
        Sessions stay signed in for 30 days of inactivity.
      </Text>

      <ConfirmDialog
        visible={confirmSignOut}
        title="Sign out?"
        body="You'll need your email and password to get back in."
        confirmLabel="Sign out"
        destructive
        onCancel={() => setConfirmSignOut(false)}
        onConfirm={() => {
          setConfirmSignOut(false);
          signOut();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  profileCopy: { flex: 1, gap: 2 },
  profileBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  rows: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
  },
  settingCopy: { flex: 1, gap: 2 },
  foot: { paddingHorizontal: spacing.xl, paddingVertical: spacing.xxl, textAlign: 'center' },
});
