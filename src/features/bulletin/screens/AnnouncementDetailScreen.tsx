import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import {
  Avatar,
  Badge,
  Card,
  ConfirmDialog,
  ErrorState,
  LinkedText,
  ScreenHeader,
  Sheet,
  SheetAction,
  Text,
  type HeaderAction,
} from '@/components/ui';
import { absoluteDateTime, relativeTime } from '@/lib/format';
import { useActions, useData, userName } from '@/lib/mock/store';
import { useSession } from '@/stores/session';
import { colors, spacing } from '@/theme';

export function AnnouncementDetailScreen({ id }: { id: string }) {
  const db = useData();
  const actions = useActions();
  const { user, isAdmin } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const announcement = db.announcements.find((a) => a.id === id);

  if (!announcement) {
    return (
      <Screen header={<ScreenHeader title="Announcement" showBack />}>
        <ErrorState
          title="This announcement is gone"
          body="It was deleted while you were looking at the list."
          onRetry={() => router.back()}
        />
      </Screen>
    );
  }

  const author = userName(db, announcement.authorId);
  const isAuthor = user?.id === announcement.authorId;
  // FR-BB-6/7 — authors manage their own; admins manage anything.
  const canEdit = isAuthor || isAdmin;

  const headerActions: HeaderAction[] = canEdit
    ? [
        {
          icon: 'ellipsis-horizontal',
          label: 'Announcement actions',
          onPress: () => setMenuOpen(true),
        },
      ]
    : [];

  return (
    <Screen header={<ScreenHeader title="Announcement" showBack actions={headerActions} />}>
      <Card>
        {announcement.isPinned ? (
          <View style={styles.pinRow}>
            <Badge label="Pinned" tone="primary" />
          </View>
        ) : null}

        <Text variant="title">{announcement.title}</Text>

        <View style={styles.byline}>
          <Avatar name={author} size={34} />
          <View style={styles.bylineCopy}>
            <Text variant="label">{author}</Text>
            <Text variant="caption" tone="subtle">
              {absoluteDateTime(announcement.createdAt)}
            </Text>
          </View>
        </View>

        {/* FR-BB-5 — plain text, line breaks preserved, URLs tappable. */}
        <LinkedText variant="body" style={styles.body}>
          {announcement.body}
        </LinkedText>

        {announcement.editedAt ? (
          <Text variant="caption" tone="subtle" style={styles.edited}>
            Edited {relativeTime(announcement.editedAt)}
          </Text>
        ) : null}
      </Card>

      <Sheet visible={menuOpen} onClose={() => setMenuOpen(false)} title="Announcement">
        {isAdmin ? (
          <SheetAction
            icon={announcement.isPinned ? 'pin-outline' : 'pin'}
            label={announcement.isPinned ? 'Unpin from the top' : 'Pin to the top'}
            description={
              announcement.isPinned
                ? 'Moves it back into the chronological list.'
                : 'Pinned announcements sit above everything else.'
            }
            onPress={() => {
              actions.togglePin(announcement.id);
              setMenuOpen(false);
            }}
          />
        ) : null}
        <SheetAction
          icon="create-outline"
          label="Edit"
          description="The announcement will be marked as edited."
          onPress={() => {
            setMenuOpen(false);
            router.push(`/bulletin/compose?id=${announcement.id}`);
          }}
        />
        <SheetAction
          icon="trash-outline"
          label="Delete"
          tone="danger"
          description={isAuthor ? 'You posted this.' : 'You can delete this as an admin.'}
          onPress={() => {
            setMenuOpen(false);
            setConfirmDelete(true);
          }}
        />
      </Sheet>

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this announcement?"
        body="It will be removed from the bulletin board for everyone. Deletions are soft, so an administrator can still recover it from the database."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          actions.deleteAnnouncement(announcement.id);
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  pinRow: { marginBottom: spacing.sm },
  byline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingBottom: spacing.lg,
    marginBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  bylineCopy: { gap: 1 },
  body: { marginBottom: spacing.sm },
  edited: { marginTop: spacing.md, fontStyle: 'italic' },
});
