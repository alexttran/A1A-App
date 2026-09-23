import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import { Banner, Button, Chip, Input, ScreenHeader, Text } from '@/components/ui';
import { useActions, useData } from '@/lib/mock/store';
import { useUiPrefs } from '@/stores/uiPrefs';
import { spacing } from '@/theme';

/** Admin-only surgeon create/edit — FR-DIR-4, FR-DIR-5, FR-DIR-7. */
export function SurgeonFormScreen({
  surgeonId,
  defaultHospitalId,
}: {
  surgeonId?: string;
  defaultHospitalId?: string;
}) {
  const db = useData();
  const actions = useActions();
  const { phiNoticeDismissed, dismissPhiNotice } = useUiPrefs();

  const existing = surgeonId ? db.surgeons.find((s) => s.id === surgeonId) : undefined;

  const [firstName, setFirstName] = useState(existing?.firstName ?? '');
  const [lastName, setLastName] = useState(existing?.lastName ?? '');
  const [hospitalId, setHospitalId] = useState(
    existing?.hospitalId ?? defaultHospitalId ?? db.hospitals[0]?.id ?? '',
  );
  const [specialty, setSpecialty] = useState(existing?.specialty ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [touched, setTouched] = useState(false);

  const firstError = touched && firstName.trim().length === 0 ? 'Required.' : undefined;
  const lastError = touched && lastName.trim().length === 0 ? 'Required.' : undefined;
  const valid = firstName.trim().length > 0 && lastName.trim().length > 0 && hospitalId.length > 0;

  const save = () => {
    setTouched(true);
    if (!valid) return;
    const payload = {
      hospitalId,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      specialty: specialty.trim(),
      phone: phone.trim(),
      email: email.trim(),
      notes: notes.trim(),
    };
    if (existing) {
      actions.updateSurgeon(existing.id, payload);
      router.back();
      return;
    }
    const id = actions.addSurgeon(payload);
    router.replace(`/directory/surgeon/${id}`);
  };

  return (
    <Screen
      header={<ScreenHeader title={existing ? 'Edit surgeon' : 'New surgeon'} showBack />}
      footer={
        <View style={styles.footer}>
          <Button
            label="Cancel"
            variant="ghost"
            onPress={() => router.back()}
            style={styles.flex}
          />
          <Button
            label={existing ? 'Save' : 'Add surgeon'}
            onPress={save}
            disabled={!valid}
            style={styles.flex}
          />
        </View>
      }
    >
      <View style={styles.row}>
        <View style={styles.flex}>
          <Input
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            error={firstError}
            required
          />
        </View>
        <View style={styles.flex}>
          <Input
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            error={lastError}
            required
          />
        </View>
      </View>

      {/* FR-DIR-5 — exactly one hospital per surgeon, so this is single-select. */}
      <View style={styles.group}>
        <Text variant="label" tone="muted">
          Hospital *
        </Text>
        <View style={styles.chips}>
          {db.hospitals.map((hospital) => (
            <Chip
              key={hospital.id}
              label={hospital.name}
              selected={hospital.id === hospitalId}
              onPress={() => setHospitalId(hospital.id)}
            />
          ))}
        </View>
        <Text variant="caption" tone="subtle">
          Each surgeon belongs to one hospital. If they operate at two, add them twice.
        </Text>
      </View>

      <Input
        label="Specialty"
        value={specialty}
        onChangeText={setSpecialty}
        placeholder="Total joint reconstruction, spine, trauma…"
      />
      <Input
        label="Phone"
        value={phone}
        onChangeText={setPhone}
        placeholder="(614) 555-0201"
        keyboardType="phone-pad"
      />
      <Input
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="r.arden@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
      />

      {!phiNoticeDismissed ? (
        <Banner
          tone="warning"
          title="Do not enter patient information"
          body="Notes describe the surgeon and how to work with them — never a patient or a specific case."
          onDismiss={dismissPhiNotice}
        />
      ) : null}

      <Input
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Block days, room habits, who their coordinator is…"
        multiline
        minHeight={120}
        hint="Detailed preferences belong on preference cards, which everyone can edit."
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.sm },
  group: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: { flexDirection: 'row', gap: spacing.sm },
});
