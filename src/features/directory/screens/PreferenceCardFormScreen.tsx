import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import { Banner, Button, Card, ConfirmDialog, Input, ScreenHeader, Text } from '@/components/ui';
import { relativeTime } from '@/lib/format';
import { cardById, surgeonName, useActions, useData } from '@/lib/mock/store';
import { useCurrentUser } from '@/stores/session';
import { useUiPrefs } from '@/stores/uiPrefs';
import { colors, spacing } from '@/theme';

const TOPIC_MAX = 100; // FR-PREF-2
const BODY_MAX = 2_000; // FR-PREF-2

type Conflict = { by: string; theirTopic: string; theirBody: string };

/**
 * Add or edit a preference card.
 *
 * The interesting part is FR-PREF-13: when someone else has saved since this form
 * was opened, the save is rejected and the user's draft is preserved with the
 * other person named. Losing a rep's typing to a silent overwrite is exactly the
 * failure that sends them back to text messages.
 */
export function PreferenceCardFormScreen({
  surgeonId,
  cardId,
}: {
  surgeonId: string;
  cardId?: string;
}) {
  const db = useData();
  const actions = useActions();
  const user = useCurrentUser();
  const { phiNoticeDismissed, dismissPhiNotice } = useUiPrefs();

  const surgeon = db.surgeons.find((s) => s.id === surgeonId);
  const existing = cardId ? cardById(db, cardId) : undefined;

  const [topic, setTopic] = useState(existing?.topic ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [touched, setTouched] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [conflict, setConflict] = useState<Conflict | null>(null);

  /**
   * The version this form was opened against — the concurrency token sent with
   * the save. Captured once at mount on purpose: if it tracked the live card it
   * would silently absorb someone else's save and defeat FR-PREF-13.
   */
  const [openedAtVersion] = useState(() => existing?.version ?? 0);

  const dirty = topic !== (existing?.topic ?? '') || body !== (existing?.body ?? '');
  const topicError = touched && topic.trim().length === 0 ? 'A topic is required.' : undefined;
  const bodyError = touched && body.trim().length === 0 ? 'Describe the preference.' : undefined;
  const valid = topic.trim().length > 0 && body.trim().length > 0;

  const save = () => {
    setTouched(true);
    if (!valid || !surgeon) return;

    if (!existing) {
      actions.addCard(surgeon.id, topic.trim(), body.trim(), user.id);
      router.back();
      return;
    }

    const result = actions.saveCard(
      existing.id,
      topic.trim(),
      body.trim(),
      openedAtVersion,
      user.id,
    );
    if (result.ok) {
      router.back();
      return;
    }
    // Draft is left exactly as typed — the user can re-apply it after reading theirs.
    setConflict({
      by: result.conflictedWith,
      theirTopic: result.theirTopic,
      theirBody: result.theirBody,
    });
  };

  const leave = () => (dirty ? setConfirmDiscard(true) : router.back());

  return (
    <Screen
      header={
        <ScreenHeader
          title={existing ? 'Edit preference' : 'New preference'}
          subtitle={surgeon ? surgeonName(surgeon) : undefined}
          showBack
          onBack={leave}
        />
      }
      footer={
        <View style={styles.footer}>
          <Button label="Cancel" variant="ghost" onPress={leave} style={styles.flex} />
          <Button
            label={existing ? 'Save' : 'Add preference'}
            onPress={save}
            disabled={!valid}
            style={styles.flex}
          />
        </View>
      }
    >
      {/* FR-PREF-13 — the conflict message names who edited it and keeps the draft. */}
      {conflict ? (
        <Card style={styles.conflict}>
          <Text variant="heading" tone="danger">
            This card was updated while you were editing
          </Text>
          <Text variant="body" tone="muted" style={styles.spaced}>
            {conflict.by} saved a change to this card. Your draft has been kept — read their version
            below, then save again to apply yours on top.
          </Text>

          <View style={styles.theirs}>
            <Text variant="micro" tone="subtle">
              {conflict.by.toUpperCase()}&apos;S VERSION
            </Text>
            <Text variant="bodyStrong" style={styles.spacedSm}>
              {conflict.theirTopic}
            </Text>
            <Text variant="body" tone="muted">
              {conflict.theirBody}
            </Text>
          </View>

          <View style={styles.conflictActions}>
            <Button
              label="Keep my draft"
              variant="secondary"
              size="sm"
              onPress={() => setConflict(null)}
            />
            <Button
              label="Use theirs instead"
              variant="ghost"
              size="sm"
              onPress={() => {
                setTopic(conflict.theirTopic);
                setBody(conflict.theirBody);
                setConflict(null);
              }}
            />
          </View>
        </Card>
      ) : null}

      {!phiNoticeDismissed ? (
        <Banner
          tone="warning"
          title="Do not enter patient information"
          body="Describe what the surgeon prefers, not what happened in a specific case. No patient names or case details."
          onDismiss={dismissPhiNotice}
        />
      ) : null}

      <Input
        label="Topic"
        value={topic}
        onChangeText={setTopic}
        placeholder="Glove size, tray setup, communication style…"
        maxLength={TOPIC_MAX}
        showCounter
        error={topicError}
        required
      />

      <Input
        label="Preference"
        value={body}
        onChangeText={setBody}
        placeholder={
          'What should a covering rep know?\n\nBe specific enough to act on without calling anyone.'
        }
        maxLength={BODY_MAX}
        showCounter
        multiline
        minHeight={200}
        error={bodyError}
        required
      />

      {existing ? (
        <>
          <Text variant="caption" tone="subtle">
            Revision {existing.version}. Your name and the time are recorded, and the previous value
            is kept in the history — nothing is overwritten silently.
          </Text>

          {/* Prototype affordance. Lets a reviewer see the FR-PREF-13 flow without
              needing a second device. Not part of the shipping app. */}
          <Button
            label="Simulate someone else saving first"
            variant="ghost"
            size="sm"
            icon="flask-outline"
            onPress={() => actions.simulateConcurrentEdit(existing.id, user.id)}
          />
          <Text variant="caption" tone="subtle">
            Prototype only — tap that, then Save, to see the conflict message.
            {existing.version !== openedAtVersion
              ? ` Someone has saved since you opened this (now at revision ${existing.version}, updated ${relativeTime(existing.updatedAt)}).`
              : ''}
          </Text>
        </>
      ) : (
        <Text variant="caption" tone="subtle">
          Anyone on the team can add a preference to any surgeon, and anyone can improve it later.
          Only administrators can delete one.
        </Text>
      )}

      <ConfirmDialog
        visible={confirmDiscard}
        title="Discard your changes?"
        body="This preference hasn't been saved and won't be kept."
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        destructive
        onCancel={() => setConfirmDiscard(false)}
        onConfirm={() => {
          setConfirmDiscard(false);
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  footer: { flexDirection: 'row', gap: spacing.sm },
  conflict: { borderColor: colors.danger, backgroundColor: colors.dangerSoft },
  spaced: { marginTop: spacing.sm },
  spacedSm: { marginTop: spacing.xs },
  theirs: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  conflictActions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
});
