import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import { Banner, Divider, ErrorState, FieldRow, ScreenHeader, Text } from '@/components/ui';
import { absoluteDateTime, fileSize } from '@/lib/format';
import { useData, userName } from '@/lib/mock/store';
import { colors, radii, spacing } from '@/theme';

import { labelFor } from './DocumentsScreen';

/**
 * File viewer — FR-DOC-8.
 *
 * The real viewer is `react-native-pdf`, a native module that cannot run in Expo Go
 * and does not exist on web at all (requirements §8.1). What is here is the chrome
 * around it: page controls, the zoom affordance, the details panel, and the share
 * action, so the layout can be reviewed before the native module is wired up.
 */
export function DocumentViewerScreen({ id }: { id: string }) {
  const db = useData();
  const [page, setPage] = useState(1);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const file = db.documents.find((d) => d.id === id);

  if (!file) {
    return (
      <Screen header={<ScreenHeader title="File" showBack />}>
        <ErrorState
          body="This file is no longer in the shared tree."
          onRetry={() => router.back()}
        />
      </Screen>
    );
  }

  const isPdf = file.mimeType === 'application/pdf';
  // Stand-in page count, derived from size so it is at least plausible per file.
  const pageCount = isPdf ? Math.max(2, Math.round(file.sizeBytes / 900_000)) : 1;

  return (
    <Screen
      scroll={false}
      padded={false}
      header={
        <ScreenHeader
          title={file.name}
          subtitle={`${labelFor(file.mimeType)} · ${fileSize(file.sizeBytes)}`}
          showBack
          actions={[
            {
              icon: 'information-circle-outline',
              label: 'File details',
              onPress: () => setDetailsOpen((v) => !v),
            },
            { icon: 'share-outline', label: 'Share or export', onPress: () => undefined },
          ]}
        />
      }
      footer={
        isPdf ? (
          <View style={styles.pager}>
            <Pressable
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              accessibilityRole="button"
              accessibilityLabel="Previous page"
              style={styles.pagerButton}
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={page === 1 ? colors.textSubtle : colors.primary}
              />
            </Pressable>
            <Text variant="label" tone="muted">
              Page {page} of {pageCount}
            </Text>
            <Pressable
              onPress={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
              accessibilityRole="button"
              accessibilityLabel="Next page"
              style={styles.pagerButton}
            >
              <Ionicons
                name="chevron-forward"
                size={20}
                color={page === pageCount ? colors.textSubtle : colors.primary}
              />
            </Pressable>
          </View>
        ) : null
      }
    >
      {detailsOpen ? (
        <View style={styles.details}>
          <FieldRow
            icon="person-outline"
            label="Uploaded by"
            value={userName(db, file.uploadedBy)}
          />
          <Divider inset />
          <FieldRow
            icon="calendar-outline"
            label="Uploaded"
            value={absoluteDateTime(file.createdAt)}
          />
          <Divider inset />
          <FieldRow
            icon="lock-closed-outline"
            label="Access"
            value="Signed link, expires in 60 minutes"
          />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.stage}>
        <View style={styles.sheet}>
          <View style={styles.sheetHead}>
            <Ionicons
              name={isPdf ? 'document-text-outline' : 'image-outline'}
              size={30}
              color={colors.primary}
            />
            <Text variant="bodyStrong" style={styles.center}>
              {isPdf ? `Page ${page}` : 'Full-screen image'}
            </Text>
          </View>

          {/* Placeholder page body — enough structure to judge the frame around it. */}
          <View style={styles.lines}>
            {Array.from({ length: isPdf ? 12 : 0 }).map((_, index) => (
              <View
                key={index}
                style={[
                  styles.line,
                  index % 4 === 3 && styles.lineShort,
                  index === 0 && styles.lineHead,
                ]}
              />
            ))}
            {!isPdf ? <View style={styles.imageBlock} /> : null}
          </View>

          <Text variant="caption" tone="subtle" style={styles.center}>
            {isPdf ? 'Pinch to zoom, scroll to move through pages.' : 'Pinch to zoom, drag to pan.'}
          </Text>
        </View>

        <View style={styles.note}>
          <Banner
            tone="info"
            title="Viewer not wired up yet"
            body={
              isPdf
                ? 'Rendering uses react-native-pdf, a native module that needs a custom dev client. This screen is the surrounding layout only.'
                : 'Image rendering arrives with the real storage layer. This screen is the surrounding layout only.'
            }
          />
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: 'center' },
  details: {
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
  },
  stage: { padding: spacing.lg, gap: spacing.lg, backgroundColor: colors.surfaceSunken },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.xl,
    gap: spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minHeight: 380,
  },
  sheetHead: { alignItems: 'center', gap: spacing.sm },
  lines: { flex: 1, gap: spacing.sm },
  line: { height: 9, borderRadius: radii.sm, backgroundColor: colors.surfaceSunken },
  lineShort: { width: '62%' },
  lineHead: { height: 14, width: '45%', backgroundColor: colors.border },
  imageBlock: {
    flex: 1,
    minHeight: 220,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceSunken,
  },
  note: { paddingBottom: spacing.lg },
  pager: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pagerButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
