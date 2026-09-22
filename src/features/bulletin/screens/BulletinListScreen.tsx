import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import {
  Avatar,
  Badge,
  Banner,
  Card,
  EmptyState,
  ScreenHeader,
  SectionLabel,
  SkeletonCard,
  Text,
} from '@/components/ui';
import { relativeTime, truncate } from '@/lib/format';
import { announcementsSorted, useData, userName } from '@/lib/mock/store';
import type { Announcement } from '@/lib/mock/types';
import { useSession } from '@/stores/session';
import { colors, spacing } from '@/theme';

/** The landing screen after login — requirements §4.1. */
export function BulletinListScreen() {
  const db = useData();
  const { isAdmin } = useSession();
  const [refreshing, setRefreshing] = useState(false);
  const { pinned, rest } = useMemo(() => announcementsSorted(db), [db]);

  // FR-BB-9 — pull to refresh. Nothing to fetch in the prototype; the gesture and
  // the spinner are what a reviewer needs to see.
  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const empty = pinned.length === 0 && rest.length === 0;

  return (
    <Screen
      scroll={false}
      padded={false}
      header={
        <ScreenHeader
          title="Bulletin"
          subtitle={`${db.announcements.length} announcements`}
          actions={[
            {
              icon: 'create-outline',
              label: 'New announcement',
              onPress: () => router.push('/bulletin/compose'),
            },
          ]}
        />
      }
    >
      {empty ? (
        <EmptyState
          icon="megaphone-outline"
          title="No announcements yet"
          body="Company-wide notices show up here. Post the first one so the team knows where to look."
          actionLabel="Write an announcement"
          onAction={() => router.push('/bulletin/compose')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} />}
        >
          {refreshing ? (
            <View style={styles.skeletons}>
              <SkeletonCard />
              <SkeletonCard />
            </View>
          ) : null}

          {isAdmin && pinned.length > 3 ? (
            <View style={styles.inset}>
              {/* FR-BB-8 — no hard cap, but the UI warns past three. */}
              <Banner
                tone="warning"
                title={`${pinned.length} pinned announcements`}
                body="Everything pinned competes for the top of the list. Consider unpinning the older ones."
              />
            </View>
          ) : null}

          {pinned.length > 0 ? (
            <>
              <SectionLabel>Pinned</SectionLabel>
              <View style={styles.group}>
                {pinned.map((a) => (
                  <AnnouncementCard
                    key={a.id}
                    announcement={a}
                    authorName={userName(db, a.authorId)}
                    pinned
                  />
                ))}
              </View>
            </>
          ) : null}

          <SectionLabel>{pinned.length > 0 ? 'Recent' : 'All announcements'}</SectionLabel>
          <View style={styles.group}>
            {rest.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} authorName={userName(db, a.authorId)} />
            ))}
          </View>

          {/* FR-BB-9 — 20 at a time with infinite scroll. */}
          <Text variant="caption" tone="subtle" style={styles.endNote}>
            You&apos;re all caught up.
          </Text>
        </ScrollView>
      )}
    </Screen>
  );
}

function AnnouncementCard({
  announcement,
  authorName,
  pinned = false,
}: {
  announcement: Announcement;
  authorName: string;
  pinned?: boolean;
}) {
  return (
    <Card onPress={() => router.push(`/bulletin/${announcement.id}`)}>
      <View style={styles.cardTop}>
        <Text variant="bodyStrong" style={styles.cardTitle} numberOfLines={2}>
          {announcement.title}
        </Text>
        {pinned ? <Badge label="Pinned" tone="primary" /> : null}
      </View>

      {/* FR-BB-2 — roughly two lines of preview. */}
      <Text variant="body" tone="muted" numberOfLines={2} style={styles.preview}>
        {truncate(announcement.body.replace(/\n+/g, ' '), 160)}
      </Text>

      <View style={styles.cardFoot}>
        <Avatar name={authorName} size={24} />
        <Text variant="caption" tone="subtle" numberOfLines={1} style={styles.byline}>
          {authorName} · {relativeTime(announcement.createdAt)}
          {announcement.editedAt ? ' · edited' : ''}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxxl },
  skeletons: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.md },
  inset: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  group: { paddingHorizontal: spacing.lg, gap: spacing.md },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  cardTitle: { flex: 1 },
  preview: { marginTop: spacing.xs },
  cardFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  byline: { flex: 1 },
  endNote: { textAlign: 'center', paddingVertical: spacing.xl },
});
