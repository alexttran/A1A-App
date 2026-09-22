import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Screen } from '@/components/Screen';
import {
  Avatar,
  Badge,
  Banner,
  Button,
  Chip,
  ConfirmDialog,
  Divider,
  Input,
  ListRow,
  ScreenHeader,
  SearchField,
  SectionLabel,
  Sheet,
  SheetAction,
  Text,
} from '@/components/ui';
import { dateMedium } from '@/lib/format';
import { useActions, useData } from '@/lib/mock/store';
import type { Role, User } from '@/lib/mock/types';
import { useCurrentUser } from '@/stores/session';
import { colors, radii, spacing } from '@/theme';

/** User management — requirements §4.6. */
export function UsersScreen() {
  const db = useData();
  const actions = useActions();
  const me = useCurrentUser();

  const [query, setQuery] = useState('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('standard');
  const [menuUser, setMenuUser] = useState<User | null>(null);
  const [confirmDeactivate, setConfirmDeactivate] = useState<User | null>(null);
  const [blocked, setBlocked] = useState<string | null>(null);

  const adminCount = db.users.filter((u) => u.role === 'admin' && u.isActive).length;

  const needle = query.trim().toLowerCase();
  const { active, inactive } = useMemo(() => {
    const matches = db.users
      .filter(
        (u) =>
          needle.length === 0 ||
          u.fullName.toLowerCase().includes(needle) ||
          u.email.toLowerCase().includes(needle),
      )
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
    return {
      active: matches.filter((u) => u.isActive),
      inactive: matches.filter((u) => !u.isActive),
    };
  }, [db.users, needle]);

  /** FR-ADM-4 — no self-demotion, and never remove the last admin. */
  const demote = (user: User) => {
    if (user.id === me.id) {
      setBlocked('You cannot remove your own admin role. Ask another administrator to do it.');
      return;
    }
    if (user.role === 'admin' && adminCount <= 1) {
      setBlocked('This is the only active administrator. Promote someone else first.');
      return;
    }
    actions.setUserRole(user.id, user.role === 'admin' ? 'standard' : 'admin');
  };

  return (
    <Screen
      scroll={false}
      padded={false}
      header={
        <ScreenHeader
          title="Users"
          subtitle={`${active.length} active · ${adminCount} admin${adminCount === 1 ? '' : 's'}`}
          showBack
          actions={[
            {
              icon: 'person-add-outline',
              label: 'Invite user',
              onPress: () => setInviteOpen(true),
            },
          ]}
        />
      }
    >
      <View style={styles.controls}>
        <SearchField value={query} onChangeText={setQuery} placeholder="Search name or email" />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {blocked ? (
          <View style={styles.inset}>
            <Banner
              tone="danger"
              title="Not allowed"
              body={blocked}
              onDismiss={() => setBlocked(null)}
            />
          </View>
        ) : null}

        <SectionLabel>Active</SectionLabel>
        <View style={styles.card}>
          {active.map((user, index) => (
            <View key={user.id}>
              {index > 0 ? <Divider inset /> : null}
              <ListRow
                leading={<Avatar name={user.fullName} />}
                title={user.fullName}
                subtitle={user.email}
                meta={`Joined ${dateMedium(user.createdAt)}`}
                onPress={() => setMenuUser(user)}
                showChevron={false}
                trailing={
                  <View style={styles.badges}>
                    {user.id === me.id ? <Badge label="You" tone="neutral" /> : null}
                    {user.isPending ? <Badge label="Invited" tone="warning" /> : null}
                    <Badge label={user.role} tone={user.role === 'admin' ? 'primary' : 'neutral'} />
                  </View>
                }
              />
            </View>
          ))}
        </View>

        {inactive.length > 0 ? (
          <>
            <SectionLabel>Deactivated</SectionLabel>
            <View style={styles.card}>
              {inactive.map((user, index) => (
                <View key={user.id}>
                  {index > 0 ? <Divider inset /> : null}
                  <ListRow
                    leading={<Avatar name={user.fullName} />}
                    title={user.fullName}
                    subtitle={user.email}
                    meta="Sessions revoked · authorship retained"
                    onPress={() => setMenuUser(user)}
                    showChevron={false}
                    trailing={<Badge label="Inactive" tone="danger" />}
                  />
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text variant="caption" tone="subtle" style={styles.foot}>
          Deactivated accounts are kept, never deleted, so their name still appears on announcements
          and preference revisions they authored.
        </Text>
      </ScrollView>

      {/* FR-ADM-2 — invite by email, with the role assigned at invitation. */}
      <Sheet visible={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a user">
        <Input
          label="Full name"
          value={inviteName}
          onChangeText={setInviteName}
          placeholder="Casey Lindqvist"
          required
        />
        <Input
          label="Work email"
          value={inviteEmail}
          onChangeText={setInviteEmail}
          placeholder="casey.lindqvist@a1asurgical.com"
          autoCapitalize="none"
          keyboardType="email-address"
          required
        />
        <View style={styles.group}>
          <Text variant="label" tone="muted">
            Role
          </Text>
          <View style={styles.chips}>
            <Chip
              label="Standard"
              selected={inviteRole === 'standard'}
              onPress={() => setInviteRole('standard')}
            />
            <Chip
              label="Admin"
              selected={inviteRole === 'admin'}
              onPress={() => setInviteRole('admin')}
            />
          </View>
        </View>
        <Button
          label="Send invitation"
          onPress={() => {
            actions.inviteUser(inviteEmail.trim(), inviteName.trim(), inviteRole);
            setInviteName('');
            setInviteEmail('');
            setInviteRole('standard');
            setInviteOpen(false);
          }}
          disabled={inviteName.trim().length === 0 || !inviteEmail.includes('@')}
          fullWidth
          style={styles.spaced}
        />
        <Text variant="caption" tone="subtle" style={styles.spaced}>
          They receive a link to set their own password. There is no self-signup.
        </Text>
      </Sheet>

      <Sheet
        visible={menuUser !== null}
        onClose={() => setMenuUser(null)}
        title={menuUser?.fullName ?? ''}
      >
        <SheetAction
          icon="swap-horizontal-outline"
          label={menuUser?.role === 'admin' ? 'Change to standard' : 'Make administrator'}
          description={
            menuUser?.id === me.id
              ? 'You cannot change your own role.'
              : 'Admins manage the directory, the calendar, and users.'
          }
          onPress={() => {
            const user = menuUser;
            setMenuUser(null);
            if (user) demote(user);
          }}
        />
        {menuUser?.isActive ? (
          <SheetAction
            icon="close-circle-outline"
            label="Deactivate"
            tone="danger"
            description="Revokes their sessions immediately."
            onPress={() => {
              const user = menuUser;
              setMenuUser(null);
              setConfirmDeactivate(user);
            }}
          />
        ) : (
          <SheetAction
            icon="checkmark-circle-outline"
            label="Reactivate"
            description="They can sign in again with their existing password."
            onPress={() => {
              const user = menuUser;
              setMenuUser(null);
              if (user) actions.setUserActive(user.id, true);
            }}
          />
        )}
      </Sheet>

      <ConfirmDialog
        visible={confirmDeactivate !== null}
        title={`Deactivate ${confirmDeactivate?.fullName ?? ''}?`}
        body="They are signed out of every device immediately and cannot sign back in. Their account and everything they authored is kept."
        confirmLabel="Deactivate"
        destructive
        onCancel={() => setConfirmDeactivate(null)}
        onConfirm={() => {
          const user = confirmDeactivate;
          setConfirmDeactivate(null);
          if (!user) return;
          if (user.role === 'admin' && adminCount <= 1) {
            setBlocked('This is the only active administrator. Promote someone else first.');
            return;
          }
          if (user.id === me.id) {
            setBlocked('You cannot deactivate your own account.');
            return;
          }
          actions.setUserActive(user.id, false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  list: { paddingBottom: spacing.xxxl },
  inset: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  badges: { alignItems: 'flex-end', gap: spacing.xs },
  group: { gap: spacing.sm, marginTop: spacing.sm },
  chips: { flexDirection: 'row', gap: spacing.sm },
  spaced: { marginTop: spacing.md },
  foot: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, textAlign: 'center' },
});
