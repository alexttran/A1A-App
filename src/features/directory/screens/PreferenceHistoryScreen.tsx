import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import {
  Badge,
  Banner,
  Card,
  ErrorState,
  ScreenHeader,
  Text,
  type BadgeTone,
} from '@/components/ui';
import { absoluteDateTime } from '@/lib/format';
import { cardById, revisionsForCard, useData, userName } from '@/lib/mock/store';
import type { PreferenceCardRevision, RevisionAction } from '@/lib/mock/types';
import { colors, radii, spacing } from '@/theme';

const actionLabel: Record<RevisionAction, string> = {
  created: 'Created',
  edited: 'Edited',
  deleted: 'Deleted',
};

const actionTone: Record<RevisionAction, BadgeTone> = {
  created: 'success',
  edited: 'primary',
  deleted: 'danger',
};

/**
 * Preference card history — FR-PREF-7 through FR-PREF-11.
 *
 * Oldest first, absolute timestamps, and where a field changed the previous value
 * sits directly above the new one so the change is legible without diffing in your
 * head. Append-only: there is no edit or delete affordance anywhere on this screen,
 * for admins included, and no revert (FR-PREF-11).
 */
export function PreferenceHistoryScreen({ cardId }: { cardId: string }) {
  const db = useData();
  const card = cardById(db, cardId);
  const revisions = revisionsForCard(db, cardId);

  if (!card) {
    return (
      <Screen header={<ScreenHeader title="History" showBack />}>
        <ErrorState body="This preference card no longer exists." onRetry={() => router.back()} />
      </Screen>
    );
  }

  return (
    <Screen header={<ScreenHeader title="History" subtitle={card.topic} showBack />}>
      <Banner
        tone="info"
        body={`${revisions.length} revision${revisions.length === 1 ? '' : 's'}, oldest first. This log is permanent — it cannot be edited or deleted by anyone, including administrators.`}
      />

      {revisions.map((revision, index) => (
        <RevisionEntry
          key={revision.id}
          revision={revision}
          authorName={userName(db, revision.changedBy)}
          isLast={index === revisions.length - 1}
        />
      ))}

      <Text variant="caption" tone="subtle" style={styles.foot}>
        Revisions are not revertible in this version. To go back to an earlier value, copy it from
        here into a new edit.
      </Text>
    </Screen>
  );
}

function RevisionEntry({
  revision,
  authorName,
  isLast,
}: {
  revision: PreferenceCardRevision;
  authorName: string;
  isLast: boolean;
}) {
  const topicChanged = revision.prevTopic !== null && revision.prevTopic !== revision.topic;
  const bodyChanged = revision.prevBody !== null && revision.prevBody !== revision.body;

  return (
    <View style={styles.entry}>
      <View style={styles.rail}>
        <View style={[styles.node, isLast && styles.nodeCurrent]}>
          <Ionicons
            name={
              revision.action === 'created'
                ? 'add'
                : revision.action === 'deleted'
                  ? 'trash-outline'
                  : 'pencil'
            }
            size={12}
            color={isLast ? colors.textInverse : colors.textMuted}
          />
        </View>
        {!isLast ? <View style={styles.line} /> : null}
      </View>

      <Card style={styles.entryCard}>
        <View style={styles.entryHead}>
          <Badge label={actionLabel[revision.action]} tone={actionTone[revision.action]} />
          {isLast ? <Badge label="Current" tone="neutral" /> : null}
          <Text variant="caption" tone="subtle" style={styles.revNo}>
            rev {revision.revisionNo}
          </Text>
        </View>

        {/* FR-PREF-8 — who, and when, absolutely. */}
        <Text variant="label" style={styles.who}>
          {authorName}
        </Text>
        <Text variant="caption" tone="subtle">
          {absoluteDateTime(revision.changedAt)}
        </Text>

        {/* FR-PREF-9 — value at this revision, with the previous value where it changed. */}
        <View style={styles.fields}>
          <FieldDiff
            label="Topic"
            previous={topicChanged ? revision.prevTopic : null}
            current={revision.topic}
            changed={topicChanged || revision.action === 'created'}
          />
          <FieldDiff
            label="Preference"
            previous={bodyChanged ? revision.prevBody : null}
            current={revision.body}
            changed={bodyChanged || revision.action === 'created'}
          />
        </View>
      </Card>
    </View>
  );
}

function FieldDiff({
  label,
  previous,
  current,
  changed,
}: {
  label: string;
  previous: string | null;
  current: string;
  changed: boolean;
}) {
  return (
    <View style={styles.field}>
      <View style={styles.fieldHead}>
        <Text variant="micro" tone="subtle">
          {label.toUpperCase()}
        </Text>
        {!changed ? (
          <Text variant="micro" tone="subtle">
            UNCHANGED
          </Text>
        ) : null}
      </View>

      {previous !== null ? (
        <View style={styles.before}>
          <Text variant="micro" tone="danger">
            BEFORE
          </Text>
          <Text variant="caption" tone="muted">
            {previous}
          </Text>
        </View>
      ) : null}

      <View style={[styles.after, previous === null && styles.afterPlain]}>
        {previous !== null ? (
          <Text variant="micro" tone="success">
            AFTER
          </Text>
        ) : null}
        <Text variant="body" tone={changed ? 'default' : 'muted'}>
          {current}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  entry: { flexDirection: 'row', gap: spacing.md },
  rail: { alignItems: 'center', width: 24 },
  node: {
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    backgroundColor: colors.surfaceSunken,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  nodeCurrent: { backgroundColor: colors.primary },
  line: { flex: 1, width: StyleSheet.hairlineWidth * 2, backgroundColor: colors.border },
  entryCard: { flex: 1 },
  entryHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  revNo: { marginLeft: 'auto' },
  who: { marginTop: spacing.sm },
  fields: { gap: spacing.md, marginTop: spacing.md },
  field: { gap: spacing.xs },
  fieldHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  before: {
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.dangerSoft,
    gap: 2,
  },
  after: {
    padding: spacing.sm,
    borderRadius: radii.sm,
    backgroundColor: colors.successSoft,
    gap: 2,
  },
  afterPlain: { padding: 0, backgroundColor: 'transparent' },
  foot: { textAlign: 'center', paddingTop: spacing.lg },
});
