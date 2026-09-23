import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import {
  Avatar,
  Badge,
  Button,
  Card,
  ConfirmDialog,
  Divider,
  ErrorState,
  FieldRow,
  ScreenHeader,
  SectionLabel,
  SegmentedControl,
  Sheet,
  SheetAction,
  Text,
  type HeaderAction,
} from '@/components/ui';
import { relativeTime } from '@/lib/format';
import { cardsForSurgeon, surgeonName, useActions, useData, userName } from '@/lib/mock/store';
import type { PreferenceCard } from '@/lib/mock/types';
import { useCurrentUser, useSession } from '@/stores/session';
import { useUiPrefs, type CardSort } from '@/stores/uiPrefs';
import { colors, radii, spacing } from '@/theme';

/**
 * Surgeon detail — contact information plus the preference cards.
 *
 * This is the screen requirements §8.3 calls the app's real value: if adding a
 * preference or finding one someone else added is awkward here, reps go back to
 * text messages. So preferences are not buried below the contact block — the
 * contact fields collapse to a compact row and the cards get the space.
 */
export function SurgeonDetailScreen({ id }: { id: string }) {
  const db = useData();
  const actions = useActions();
  const { isAdmin } = useSession();
  const currentUser = useCurrentUser();
  const { cardSort, setCardSort } = useUiPrefs();
  const [contactOpen, setContactOpen] = useState(false);
  const [cardMenu, setCardMenu] = useState<PreferenceCard | null>(null);
  const [confirmDeleteCard, setConfirmDeleteCard] = useState<PreferenceCard | null>(null);
  const [confirmDeleteSurgeon, setConfirmDeleteSurgeon] = useState(false);

  const surgeon = db.surgeons.find((s) => s.id === id);

  if (!surgeon) {
    return (
      <Screen header={<ScreenHeader title="Surgeon" showBack />}>
        <ErrorState
          body="This surgeon is no longer in the directory."
          onRetry={() => router.back()}
        />
      </Screen>
    );
  }

  const hospital = db.hospitals.find((h) => h.id === surgeon.hospitalId);
  const cards = cardsForSurgeon(db, surgeon.id, cardSort);
  const archived = cardsForSurgeon(db, surgeon.id, cardSort, true).filter((c) => c.isDeleted);

  const headerActions: HeaderAction[] = isAdmin
    ? [
        {
          icon: 'create-outline',
          label: 'Edit surgeon',
          onPress: () => router.push(`/directory/surgeon/${surgeon.id}/edit`),
        },
      ]
    : [];

  return (
    <Screen
      padded={false}
      header={
        <ScreenHeader
          title={surgeonName(surgeon)}
          subtitle={surgeon.specialty || undefined}
          showBack
          actions={headerActions}
        />
      }
      footer={
        <Button
          label="Add a preference"
          icon="add"
          onPress={() => router.push(`/directory/surgeon/${surgeon.id}/card/new`)}
          fullWidth
        />
      }
    >
      {/* Identity + contact, collapsed by default so the cards stay above the fold. */}
      <View style={styles.block}>
        <Card padded={false}>
          <Pressable
            onPress={() => setContactOpen((open) => !open)}
            accessibilityRole="button"
            accessibilityState={{ expanded: contactOpen }}
            accessibilityLabel="Contact details"
            style={({ pressed }) => [styles.identity, pressed && styles.pressed]}
          >
            <Avatar name={`${surgeon.firstName} ${surgeon.lastName}`} size={44} />
            <View style={styles.identityCopy}>
              {/* The header already says who this is, so the card leads with the
                  hospital and acts as the contact disclosure. */}
              <Text variant="bodyStrong" numberOfLines={1}>
                {hospital?.name ?? 'Unassigned'}
              </Text>
              <Text variant="caption" tone="muted">
                {contactOpen ? 'Hide contact details' : 'Phone, email, and notes'}
              </Text>
            </View>
            <Ionicons
              name={contactOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={colors.textSubtle}
            />
          </Pressable>

          {contactOpen ? (
            <View>
              <Divider />
              {/* FR-DIR-8 — tappable phone and email. */}
              {surgeon.phone ? (
                <FieldRow
                  icon="call-outline"
                  label="Phone"
                  value={surgeon.phone}
                  link={{ scheme: 'tel', target: surgeon.phone }}
                />
              ) : null}
              {surgeon.email ? (
                <>
                  <Divider inset />
                  <FieldRow
                    icon="mail-outline"
                    label="Email"
                    value={surgeon.email}
                    link={{ scheme: 'mailto', target: surgeon.email }}
                  />
                </>
              ) : null}
              {surgeon.notes ? (
                <>
                  <Divider inset />
                  <FieldRow
                    icon="document-text-outline"
                    label="Notes"
                    value={surgeon.notes}
                    multiline
                  />
                </>
              ) : null}
            </View>
          ) : null}
        </Card>
      </View>

      {/* Preferences */}
      <SectionLabel
        trailing={
          cards.length > 1 ? (
            <View style={styles.sortToggle}>
              {/* FR-PREF-12 — recently updated by default, alphabetical on toggle. */}
              <SegmentedControl<CardSort>
                value={cardSort}
                onChange={setCardSort}
                options={[
                  { value: 'recent', label: 'Recent' },
                  { value: 'alpha', label: 'A–Z' },
                ]}
              />
            </View>
          ) : undefined
        }
      >
        {cards.length === 0 ? 'Preferences' : `${cards.length} preferences`}
      </SectionLabel>

      {cards.length === 0 ? (
        <View style={styles.block}>
          {/* FR-PREF-1 — the first thing seen on every new surgeon. It has to invite
              the first entry rather than look broken. */}
          <Card>
            <View style={styles.emptyCard}>
              <View style={styles.emptyIcon}>
                <Ionicons name="clipboard-outline" size={24} color={colors.primary} />
              </View>
              <Text variant="heading" style={styles.center}>
                Nothing recorded yet
              </Text>
              <Text variant="body" tone="muted" style={styles.center}>
                You know something about {surgeonName(surgeon)} that a covering rep would not. Glove
                size, tray setup, or how they like to be contacted is a good first card.
              </Text>
              <Button
                label="Add the first preference"
                onPress={() => router.push(`/directory/surgeon/${surgeon.id}/card/new`)}
                style={styles.spaced}
              />
            </View>
          </Card>
        </View>
      ) : (
        <View style={styles.cardList}>
          {cards.map((card) => (
            <PreferenceCardView
              key={card.id}
              card={card}
              updatedByName={userName(db, card.updatedBy)}
              onOpenMenu={() => setCardMenu(card)}
              onEdit={() => router.push(`/directory/surgeon/${surgeon.id}/card/${card.id}`)}
              onHistory={() =>
                router.push(`/directory/surgeon/${surgeon.id}/card/${card.id}/history`)
              }
            />
          ))}
        </View>
      )}

      {/* FR-PREF-5 — deleted cards and their history stay visible to admins. */}
      {isAdmin && archived.length > 0 ? (
        <>
          <SectionLabel>{`Archived (${archived.length}) · admin only`}</SectionLabel>
          <View style={styles.cardList}>
            {archived.map((card) => (
              <Card key={card.id} style={styles.archivedCard}>
                <View style={styles.cardHead}>
                  <Text variant="bodyStrong" tone="muted" style={styles.flex}>
                    {card.topic}
                  </Text>
                  <Badge label="Deleted" tone="danger" />
                </View>
                <Text variant="caption" tone="subtle">
                  Deleted by {userName(db, card.updatedBy)}, {relativeTime(card.updatedAt)}
                </Text>
                <Button
                  label="View history"
                  variant="ghost"
                  size="sm"
                  icon="time-outline"
                  onPress={() =>
                    router.push(`/directory/surgeon/${surgeon.id}/card/${card.id}/history`)
                  }
                  style={styles.spacedSm}
                />
              </Card>
            ))}
          </View>
        </>
      ) : null}

      {isAdmin ? (
        <View style={[styles.block, styles.dangerZone]}>
          <Button
            label="Delete surgeon"
            variant="danger"
            icon="trash-outline"
            onPress={() => setConfirmDeleteSurgeon(true)}
            fullWidth
          />
        </View>
      ) : (
        <Text variant="caption" tone="subtle" style={styles.foot}>
          Anyone can add and edit preferences. Only administrators can delete them, and history is
          never editable.
        </Text>
      )}

      {/* Per-card actions */}
      <Sheet
        visible={cardMenu !== null}
        onClose={() => setCardMenu(null)}
        title={cardMenu?.topic ?? ''}
      >
        <SheetAction
          icon="create-outline"
          label="Edit this preference"
          description="Anyone can edit any card. The change is recorded with your name."
          onPress={() => {
            const card = cardMenu;
            setCardMenu(null);
            if (card) router.push(`/directory/surgeon/${surgeon.id}/card/${card.id}`);
          }}
        />
        <SheetAction
          icon="time-outline"
          label="View history"
          description="Every revision, who made it, and what changed."
          onPress={() => {
            const card = cardMenu;
            setCardMenu(null);
            if (card) router.push(`/directory/surgeon/${surgeon.id}/card/${card.id}/history`);
          }}
        />
        {isAdmin ? (
          <SheetAction
            icon="trash-outline"
            label="Delete"
            tone="danger"
            description="Admins only. The card and its history are kept."
            onPress={() => {
              const card = cardMenu;
              setCardMenu(null);
              setConfirmDeleteCard(card);
            }}
          />
        ) : null}
      </Sheet>

      <ConfirmDialog
        visible={confirmDeleteCard !== null}
        title="Delete this preference?"
        body="It will no longer appear on the surgeon. The card and its full revision history are kept and stay visible to administrators."
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDeleteCard(null)}
        onConfirm={() => {
          const card = confirmDeleteCard;
          setConfirmDeleteCard(null);
          if (card) actions.deleteCard(card.id, currentUser.id);
        }}
      />

      {/* FR-DIR-9 — the confirmation names the number of cards affected. */}
      <ConfirmDialog
        visible={confirmDeleteSurgeon}
        title={`Delete ${surgeonName(surgeon)}?`}
        body={
          cards.length > 0
            ? `${cards.length} preference card${cards.length === 1 ? '' : 's'} will be archived with them. Nothing is destroyed, and the revision history stays intact.`
            : 'This surgeon has no preference cards. Nothing is destroyed — an administrator can restore the record from the database.'
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDeleteSurgeon(false)}
        onConfirm={() => {
          setConfirmDeleteSurgeon(false);
          actions.deleteSurgeon(surgeon.id);
          router.back();
        }}
      />
    </Screen>
  );
}

function PreferenceCardView({
  card,
  updatedByName,
  onOpenMenu,
  onEdit,
  onHistory,
}: {
  card: PreferenceCard;
  updatedByName: string;
  onOpenMenu: () => void;
  onEdit: () => void;
  onHistory: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const revised = card.version > 1;

  return (
    <Card>
      <View style={styles.cardHead}>
        <Text variant="bodyStrong" style={styles.flex}>
          {card.topic}
        </Text>
        <Pressable
          onPress={onOpenMenu}
          accessibilityRole="button"
          accessibilityLabel={`Actions for ${card.topic}`}
          hitSlop={10}
          style={styles.menuButton}
        >
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSubtle} />
        </Pressable>
      </View>

      <Pressable
        onPress={() => setExpanded((open) => !open)}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${card.topic}. Tap to ${expanded ? 'collapse' : 'expand'}.`}
      >
        <Text variant="body" numberOfLines={expanded ? undefined : 3} style={styles.cardBody}>
          {card.body}
        </Text>
        {!expanded && card.body.length > 150 ? (
          <Text variant="caption" tone="primary">
            Show more
          </Text>
        ) : null}
      </Pressable>

      <View style={styles.cardFoot}>
        {/* FR-PREF-6 — on its own line, because the author's name is the whole
            point of the attribution and it was the first thing to be truncated
            when it shared a row with the actions. */}
        <Text variant="caption" tone="subtle">
          Last updated by {updatedByName}, {relativeTime(card.updatedAt)}
        </Text>

        <View style={styles.cardActions}>
          {/* FR-PREF-7 */}
          <Pressable
            onPress={onHistory}
            accessibilityRole="button"
            accessibilityLabel={`History for ${card.topic}`}
            hitSlop={8}
            style={styles.inlineAction}
          >
            <Ionicons name="time-outline" size={14} color={colors.primary} />
            <Text variant="caption" tone="primary">
              History{revised ? ` (${card.version})` : ''}
            </Text>
          </Pressable>
          <Pressable
            onPress={onEdit}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${card.topic}`}
            hitSlop={8}
            style={styles.inlineAction}
          >
            <Ionicons name="create-outline" size={14} color={colors.primary} />
            <Text variant="caption" tone="primary">
              Edit
            </Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  block: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  identity: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  pressed: { backgroundColor: colors.surfaceAlt },
  identityCopy: { flex: 1, gap: 1 },
  sortToggle: { width: 140 },
  cardList: { paddingHorizontal: spacing.lg, gap: spacing.md },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  menuButton: { width: 28, height: 24, alignItems: 'flex-end' },
  cardBody: { marginTop: spacing.xs },
  cardFoot: {
    gap: spacing.sm,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  inlineAction: { flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 24 },
  archivedCard: { backgroundColor: colors.surfaceAlt },
  emptyCard: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  emptyIcon: {
    width: 52,
    height: 52,
    borderRadius: radii.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  spaced: { marginTop: spacing.md },
  spacedSm: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  dangerZone: { paddingTop: spacing.xxl, paddingBottom: spacing.lg },
  foot: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, textAlign: 'center' },
});
