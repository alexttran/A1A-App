import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import {
  Avatar,
  Button,
  Card,
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
import { surgeonName, surgeonsForHospital, useActions, useData } from '@/lib/mock/store';
import { useSession } from '@/stores/session';
import { colors, radii, spacing } from '@/theme';

export function HospitalDetailScreen({ id }: { id: string }) {
  const db = useData();
  const actions = useActions();
  const { isAdmin } = useSession();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const hospital = db.hospitals.find((h) => h.id === id);

  if (!hospital) {
    return (
      <Screen header={<ScreenHeader title="Hospital" showBack />}>
        <ErrorState
          body="This hospital is no longer in the directory."
          onRetry={() => router.back()}
        />
      </Screen>
    );
  }

  const surgeons = surgeonsForHospital(db, hospital.id);
  const fullAddress = `${hospital.address}, ${hospital.city}, ${hospital.state} ${hospital.zip}`;

  // FR-DIR-7 — hospitals are admin-managed.
  const headerActions: HeaderAction[] = isAdmin
    ? [
        {
          icon: 'create-outline',
          label: 'Edit hospital',
          onPress: () => router.push(`/directory/hospital/${hospital.id}/edit`),
        },
      ]
    : [];

  return (
    <Screen
      padded={false}
      header={
        <ScreenHeader
          title={hospital.name}
          subtitle={`${hospital.city}, ${hospital.state}`}
          showBack
          actions={headerActions}
        />
      }
    >
      <View style={styles.block}>
        <Card padded={false}>
          {/* FR-DIR-8 — tappable phone and address. */}
          <FieldRow
            icon="call-outline"
            label="Main phone"
            value={hospital.phone}
            link={{ scheme: 'tel', target: hospital.phone }}
          />
          <Divider inset />
          <FieldRow
            icon="location-outline"
            label="Address"
            value={fullAddress}
            link={{ scheme: 'map', target: fullAddress }}
          />
        </Card>
      </View>

      {hospital.notes ? (
        <View style={styles.block}>
          <SectionLabel>Notes</SectionLabel>
          <Card>
            <Text variant="body">{hospital.notes}</Text>
          </Card>
        </View>
      ) : null}

      <View style={styles.block}>
        <SectionLabel>
          {surgeons.length === 1 ? '1 surgeon' : `${surgeons.length} surgeons`}
        </SectionLabel>

        {surgeons.length === 0 ? (
          <Card>
            <Text variant="body" tone="muted">
              No surgeons are affiliated with this hospital yet.
            </Text>
            {isAdmin ? (
              <Button
                label="Add a surgeon"
                variant="secondary"
                icon="add"
                onPress={() => router.push(`/directory/surgeon/new?hospitalId=${hospital.id}`)}
                style={styles.spaced}
              />
            ) : null}
          </Card>
        ) : (
          <View style={styles.rows}>
            {surgeons.map((surgeon, index) => {
              const cards = db.preferenceCards.filter(
                (c) => c.surgeonId === surgeon.id && !c.isDeleted,
              ).length;
              return (
                <View key={surgeon.id}>
                  {index > 0 ? <Divider inset /> : null}
                  <ListRow
                    leading={<Avatar name={`${surgeon.firstName} ${surgeon.lastName}`} />}
                    title={surgeonName(surgeon)}
                    subtitle={surgeon.specialty || 'Specialty not recorded'}
                    meta={
                      cards === 0
                        ? 'No preferences yet'
                        : `${cards} preference${cards === 1 ? '' : 's'}`
                    }
                    onPress={() => router.push(`/directory/surgeon/${surgeon.id}`)}
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>

      {isAdmin ? (
        <View style={[styles.block, styles.dangerZone]}>
          <Button
            label="Delete hospital"
            variant="danger"
            icon="trash-outline"
            onPress={() => setConfirmDelete(true)}
            fullWidth
          />
        </View>
      ) : null}

      <ConfirmDialog
        visible={confirmDelete}
        title={`Delete ${hospital.name}?`}
        body={
          surgeons.length > 0
            ? `${surgeons.length} surgeon${surgeons.length === 1 ? '' : 's'} and their preference cards will be archived along with it. Nothing is destroyed — an administrator can restore it from the database.`
            : 'Nothing is destroyed — an administrator can restore it from the database.'
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          actions.deleteHospital(hospital.id);
          router.back();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  block: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  rows: {
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  spaced: { marginTop: spacing.md },
  dangerZone: { paddingTop: spacing.xxl, paddingBottom: spacing.xxxl },
});
