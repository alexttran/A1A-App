import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import {
  Avatar,
  Divider,
  EmptyState,
  ListRow,
  ScreenHeader,
  SearchField,
  SectionLabel,
  SegmentedControl,
  Text,
} from '@/components/ui';
import { surgeonName, surgeonsForHospital, useData } from '@/lib/mock/store';
import { useSession } from '@/stores/session';
import { colors, radii, spacing } from '@/theme';

type Tab = 'hospitals' | 'surgeons';

/**
 * Directory root. Hospitals and a cross-hospital surgeon search live behind one
 * toggle rather than two tabs, because FR-DIR-6 asks for a single search field
 * that spans every hospital and reps think in surgeons more often than buildings.
 */
export function DirectoryScreen() {
  const db = useData();
  const { isAdmin } = useSession();
  const [tab, setTab] = useState<Tab>('hospitals');
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();

  const hospitals = useMemo(
    () =>
      db.hospitals
        .filter(
          (h) =>
            needle.length === 0 ||
            h.name.toLowerCase().includes(needle) ||
            h.city.toLowerCase().includes(needle),
        )
        .sort((a, b) => a.name.localeCompare(b.name)),
    [db.hospitals, needle],
  );

  const surgeons = useMemo(
    () =>
      db.surgeons
        .filter((s) => {
          if (needle.length === 0) return true;
          const full = `${s.firstName} ${s.lastName}`.toLowerCase();
          return full.includes(needle) || s.specialty.toLowerCase().includes(needle);
        })
        .sort((a, b) => a.lastName.localeCompare(b.lastName)),
    [db.surgeons, needle],
  );

  return (
    <Screen
      scroll={false}
      padded={false}
      header={
        <ScreenHeader
          title="Directory"
          subtitle={`${db.hospitals.length} hospitals · ${db.surgeons.length} surgeons`}
          actions={
            isAdmin
              ? [
                  {
                    icon: 'add',
                    label: tab === 'hospitals' ? 'Add hospital' : 'Add surgeon',
                    onPress: () =>
                      router.push(
                        tab === 'hospitals' ? '/directory/hospital/new' : '/directory/surgeon/new',
                      ),
                  },
                ]
              : []
          }
        />
      }
    >
      <View style={styles.controls}>
        <SegmentedControl<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'hospitals', label: 'Hospitals' },
            { value: 'surgeons', label: 'Surgeons' },
          ]}
        />
        <SearchField
          value={query}
          onChangeText={setQuery}
          placeholder={tab === 'hospitals' ? 'Search hospitals or cities' : 'Search all surgeons'}
        />
      </View>

      <ScrollView contentContainerStyle={styles.list}>
        {tab === 'hospitals' ? (
          hospitals.length === 0 ? (
            <EmptyState
              icon="business-outline"
              title="No hospitals match"
              body={`Nothing matches "${query}". Try a shorter search, or check the Surgeons tab.`}
            />
          ) : (
            <View style={styles.card}>
              {hospitals.map((hospital, index) => {
                const count = surgeonsForHospital(db, hospital.id).length;
                return (
                  <View key={hospital.id}>
                    {index > 0 ? <Divider inset /> : null}
                    <ListRow
                      icon="business"
                      title={hospital.name}
                      subtitle={`${hospital.city}, ${hospital.state}`}
                      meta={count === 1 ? '1 surgeon' : `${count} surgeons`}
                      onPress={() => router.push(`/directory/hospital/${hospital.id}`)}
                    />
                  </View>
                );
              })}
            </View>
          )
        ) : surgeons.length === 0 ? (
          <EmptyState
            icon="people-outline"
            title="No surgeons match"
            body={`Nothing matches "${query}". Surgeons are added by an administrator — ask Tom if someone is missing.`}
          />
        ) : (
          <>
            {/* FR-DIR-6 — results carry the hospital name, since the search spans all of them. */}
            <SectionLabel>
              {needle.length > 0
                ? `${surgeons.length} result${surgeons.length === 1 ? '' : 's'}`
                : 'All surgeons'}
            </SectionLabel>
            <View style={styles.card}>
              {surgeons.map((surgeon, index) => {
                const hospital = db.hospitals.find((h) => h.id === surgeon.hospitalId);
                const cards = db.preferenceCards.filter(
                  (c) => c.surgeonId === surgeon.id && !c.isDeleted,
                ).length;
                return (
                  <View key={surgeon.id}>
                    {index > 0 ? <Divider inset /> : null}
                    <ListRow
                      leading={<Avatar name={`${surgeon.firstName} ${surgeon.lastName}`} />}
                      title={surgeonName(surgeon)}
                      subtitle={hospital?.name ?? 'Unassigned'}
                      meta={
                        surgeon.specialty
                          ? `${surgeon.specialty} · ${cards} preference${cards === 1 ? '' : 's'}`
                          : `${cards} preference${cards === 1 ? '' : 's'}`
                      }
                      onPress={() => router.push(`/directory/surgeon/${surgeon.id}`)}
                    />
                  </View>
                );
              })}
            </View>
          </>
        )}

        <Text variant="caption" tone="subtle" style={styles.foot}>
          Hospitals and surgeons are maintained by administrators. Preference cards are open to
          everyone.
        </Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  controls: {
    gap: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  list: { paddingBottom: spacing.xxxl },
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  foot: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl, textAlign: 'center' },
});
