import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import { Banner, Button, Input, ScreenHeader, Text } from '@/components/ui';
import { useActions, useData } from '@/lib/mock/store';
import { useUiPrefs } from '@/stores/uiPrefs';
import { spacing } from '@/theme';

/** Admin-only hospital create/edit — FR-DIR-2, FR-DIR-7. */
export function HospitalFormScreen({ hospitalId }: { hospitalId?: string }) {
  const db = useData();
  const actions = useActions();
  const { phiNoticeDismissed, dismissPhiNotice } = useUiPrefs();

  const existing = hospitalId ? db.hospitals.find((h) => h.id === hospitalId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [address, setAddress] = useState(existing?.address ?? '');
  const [city, setCity] = useState(existing?.city ?? '');
  const [state, setState] = useState(existing?.state ?? '');
  const [zip, setZip] = useState(existing?.zip ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [touched, setTouched] = useState(false);

  const nameError =
    touched && name.trim().length === 0 ? 'A hospital name is required.' : undefined;
  const valid = name.trim().length > 0;

  const save = () => {
    setTouched(true);
    if (!valid) return;
    const payload = {
      name: name.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      zip: zip.trim(),
      phone: phone.trim(),
      notes: notes.trim(),
    };
    if (existing) {
      actions.updateHospital(existing.id, payload);
      router.back();
      return;
    }
    const id = actions.addHospital(payload);
    router.replace(`/directory/hospital/${id}`);
  };

  return (
    <Screen
      header={<ScreenHeader title={existing ? 'Edit hospital' : 'New hospital'} showBack />}
      footer={
        <View style={styles.footer}>
          <Button
            label="Cancel"
            variant="ghost"
            onPress={() => router.back()}
            style={styles.flex}
          />
          <Button
            label={existing ? 'Save' : 'Add hospital'}
            onPress={save}
            disabled={!valid}
            style={styles.flex}
          />
        </View>
      }
    >
      <Input
        label="Hospital name"
        value={name}
        onChangeText={setName}
        placeholder="St. Agnes Regional Medical Center"
        error={nameError}
        required
      />
      <Input
        label="Street address"
        value={address}
        onChangeText={setAddress}
        placeholder="4120 Halloran Parkway"
      />

      <View style={styles.row}>
        <View style={styles.grow}>
          <Input label="City" value={city} onChangeText={setCity} placeholder="Dayton" />
        </View>
        <View style={styles.stateField}>
          <Input
            label="State"
            value={state}
            onChangeText={setState}
            placeholder="OH"
            maxLength={2}
            autoCapitalize="characters"
          />
        </View>
        <View style={styles.zipField}>
          <Input
            label="ZIP"
            value={zip}
            onChangeText={setZip}
            placeholder="45402"
            keyboardType="number-pad"
            maxLength={10}
          />
        </View>
      </View>

      <Input
        label="Main phone"
        value={phone}
        onChangeText={setPhone}
        placeholder="(937) 555-0142"
        keyboardType="phone-pad"
        hint="Shown as a tappable number on the hospital record."
      />

      {!phiNoticeDismissed ? (
        <Banner
          tone="warning"
          title="Do not enter patient information"
          body="Notes are for logistics — docks, badges, who to ask for. Nothing about a patient."
          onDismiss={dismissPhiNotice}
        />
      ) : null}

      <Input
        label="Notes"
        value={notes}
        onChangeText={setNotes}
        placeholder="Loading dock, badge rules, who runs sterile processing…"
        multiline
        minHeight={140}
      />

      <Text variant="caption" tone="subtle">
        Only administrators can add or edit hospitals. Everyone can read them.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  grow: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  stateField: { width: 74 },
  zipField: { width: 104 },
  footer: { flexDirection: 'row', gap: spacing.sm },
});
