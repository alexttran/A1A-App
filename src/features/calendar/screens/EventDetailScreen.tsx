import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import {
  Button,
  Card,
  CategoryBadge,
  ConfirmDialog,
  Divider,
  ErrorState,
  FieldRow,
  ListRow,
  ScreenHeader,
  SectionLabel,
  Text,
  type HeaderAction,
} from '@/components/ui';
import { eventWhen } from '@/lib/format';
import { categoryById, surgeonName, useActions, useData, userName } from '@/lib/mock/store';
import { useSession } from '@/stores/session';
import { colors, radii, spacing } from '@/theme';

export function EventDetailScreen({ id }: { id: string }) {
  const db = useData();
  const actions = useActions();
  const { isAdmin } = useSession();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const event = db.events.find((e) => e.id === id);

  if (!event) {
    return (
      <Screen header={<ScreenHeader title="Event" showBack />}>
        <ErrorState body="This event is no longer on the calendar." onRetry={() => router.back()} />
      </Screen>
    );
  }

  const category = categoryById(db, event.categoryId);
  const hospital = event.hospitalId
    ? db.hospitals.find((h) => h.id === event.hospitalId)
    : undefined;
  const surgeon = event.surgeonId ? db.surgeons.find((s) => s.id === event.surgeonId) : undefined;

  // FR-CAL-9 — only admins can edit or delete.
  const headerActions: HeaderAction[] = isAdmin
    ? [
        {
          icon: 'create-outline',
          label: 'Edit event',
          onPress: () => router.push(`/calendar/event/${event.id}/edit`),
        },
      ]
    : [];

  return (
    <Screen padded={false} header={<ScreenHeader title="Event" showBack actions={headerActions} />}>
      <View style={styles.block}>
        <Card>
          {category ? (
            <View style={styles.categoryRow}>
              <CategoryBadge name={category.name} colorHex={category.colorHex} />
              {!category.isActive ? (
                <Text variant="micro" tone="subtle">
                  · RETIRED CATEGORY
                </Text>
              ) : null}
            </View>
          ) : null}

          <Text variant="title" style={styles.title}>
            {event.title}
          </Text>

          <Text variant="body" tone="muted">
            {eventWhen(event.startsAt, event.endsAt, event.isAllDay)}
          </Text>
        </Card>
      </View>

      <View style={styles.block}>
        <Card padded={false}>
          {event.location ? (
            <>
              <FieldRow
                icon="location-outline"
                label="Location"
                value={event.location}
                link={{ scheme: 'map', target: event.location }}
              />
              <Divider inset />
            </>
          ) : null}
          <FieldRow
            icon="person-outline"
            label="Created by"
            value={userName(db, event.createdBy)}
          />
        </Card>
      </View>

      {event.description ? (
        <View style={styles.block}>
          <SectionLabel>Details</SectionLabel>
          <Card>
            <Text variant="body">{event.description}</Text>
          </Card>
        </View>
      ) : null}

      {/* FR-CAL-5 — linked records deep-link into the directory. */}
      {hospital || surgeon ? (
        <>
          <SectionLabel>Linked records</SectionLabel>
          <View style={styles.block}>
            <View style={styles.rows}>
              {hospital ? (
                <ListRow
                  icon="business"
                  title={hospital.name}
                  subtitle={`${hospital.city}, ${hospital.state}`}
                  onPress={() => router.push(`/directory/hospital/${hospital.id}`)}
                />
              ) : null}
              {hospital && surgeon ? <Divider inset /> : null}
              {surgeon ? (
                <ListRow
                  icon="person"
                  title={surgeonName(surgeon)}
                  subtitle={surgeon.specialty || 'View preferences'}
                  onPress={() => router.push(`/directory/surgeon/${surgeon.id}`)}
                />
              ) : null}
            </View>
          </View>
        </>
      ) : null}

      {isAdmin ? (
        <View style={[styles.block, styles.dangerZone]}>
          <Button
            label="Delete event"
            variant="danger"
            icon="trash-outline"
            onPress={() => setConfirmDelete(true)}
            fullWidth
          />
        </View>
      ) : (
        <Text variant="caption" tone="subtle" style={styles.foot}>
          The calendar is read-only for standard users. Ask an administrator to change or remove an
          event.
        </Text>
      )}

      <ConfirmDialog
        visible={confirmDelete}
        title="Delete this event?"
        body="It will disappear from everyone's calendar. Deletions are soft, so an administrator can still recover it."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          actions.deleteEvent(event.id);
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  categoryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  title: { marginTop: spacing.sm, marginBottom: spacing.xs },
  rows: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  dangerZone: { paddingTop: spacing.xxl, paddingBottom: spacing.xxxl },
  foot: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, textAlign: 'center' },
});
