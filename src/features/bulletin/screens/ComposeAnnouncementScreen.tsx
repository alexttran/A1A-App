import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import { Banner, Button, ConfirmDialog, Input, ScreenHeader, Text } from '@/components/ui';
import { useActions, useData } from '@/lib/mock/store';
import { useCurrentUser } from '@/stores/session';
import { useUiPrefs } from '@/stores/uiPrefs';
import { spacing } from '@/theme';

const TITLE_MAX = 140; // FR-BB-4
const BODY_MAX = 5_000; // FR-BB-4

export function ComposeAnnouncementScreen({ editingId }: { editingId?: string }) {
  const db = useData();
  const actions = useActions();
  const user = useCurrentUser();
  const { phiNoticeDismissed, dismissPhiNotice } = useUiPrefs();

  const existing = useMemo(
    () => (editingId ? db.announcements.find((a) => a.id === editingId) : undefined),
    [db.announcements, editingId],
  );

  const [title, setTitle] = useState(existing?.title ?? '');
  const [body, setBody] = useState(existing?.body ?? '');
  const [touched, setTouched] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const dirty = title !== (existing?.title ?? '') || body !== (existing?.body ?? '');
  const titleError = touched && title.trim().length === 0 ? 'A title is required.' : undefined;
  const bodyError =
    touched && body.trim().length === 0 ? 'An announcement needs a body.' : undefined;
  const valid = title.trim().length > 0 && body.trim().length > 0;

  const save = () => {
    setTouched(true);
    if (!valid) return;
    if (existing) {
      actions.updateAnnouncement(existing.id, { title: title.trim(), body: body.trim() });
      router.back();
      return;
    }
    const id = actions.addAnnouncement({ title: title.trim(), body: body.trim() }, user.id);
    // Replace so Back from the new announcement returns to the list, not the form.
    router.replace(`/bulletin/${id}`);
  };

  // Unsaved-changes guard, per the Phase 1 plan.
  const leave = () => (dirty ? setConfirmDiscard(true) : router.back());

  return (
    <Screen
      header={
        <ScreenHeader
          title={existing ? 'Edit announcement' : 'New announcement'}
          showBack
          onBack={leave}
        />
      }
      footer={
        <View style={styles.footer}>
          <Button label="Cancel" variant="ghost" onPress={leave} style={styles.footerButton} />
          <Button
            label={existing ? 'Save changes' : 'Post'}
            onPress={save}
            disabled={!valid}
            style={styles.footerButton}
          />
        </View>
      }
    >
      {/* §1.4 — shown at first use per user, on every free-text surface. */}
      {!phiNoticeDismissed ? (
        <Banner
          tone="warning"
          title="Do not enter patient information"
          body="This app holds business information about hospitals and surgeons. No patient names, no dates of birth, no case details that identify a person."
          onDismiss={dismissPhiNotice}
        />
      ) : null}

      <Input
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="What do people need to know?"
        maxLength={TITLE_MAX}
        showCounter
        error={titleError}
        required
      />

      <Input
        label="Announcement"
        value={body}
        onChangeText={setBody}
        placeholder={'Write the announcement.\n\nLine breaks are kept, and links become tappable.'}
        maxLength={BODY_MAX}
        showCounter
        multiline
        minHeight={240}
        error={bodyError}
        required
      />

      <Text variant="caption" tone="subtle">
        Plain text only in this version — no bold, italics, or attachments. Pasted links are
        detected automatically.
      </Text>

      {existing ? (
        <Text variant="caption" tone="subtle">
          Saving marks this announcement as edited for everyone who reads it.
        </Text>
      ) : null}

      <ConfirmDialog
        visible={confirmDiscard}
        title="Discard this draft?"
        body="Your changes haven't been posted and won't be kept."
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
  footer: { flexDirection: 'row', gap: spacing.sm },
  footerButton: { flex: 1 },
});
