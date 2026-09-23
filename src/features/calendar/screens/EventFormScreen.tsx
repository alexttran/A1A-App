import { useMemo, useState } from 'react';
import { StyleSheet, Switch, View } from 'react-native';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import { Banner, Button, Chip, Input, ScreenHeader, SectionLabel, Text } from '@/components/ui';
import { surgeonName, useActions, useData } from '@/lib/mock/store';
import { useCurrentUser } from '@/stores/session';
import { useUiPrefs } from '@/stores/uiPrefs';
import { colors, spacing } from '@/theme';

const TITLE_MAX = 140; // FR-CAL-4
const DESCRIPTION_MAX = 2_000; // FR-CAL-4

/** Admin-only event create/edit — FR-CAL-4, FR-CAL-9, FR-CAL-12. */
export function EventFormScreen({ eventId }: { eventId?: string }) {
  const db = useData();
  const actions = useActions();
  const user = useCurrentUser();
  const { phiNoticeDismissed, dismissPhiNotice } = useUiPrefs();

  const existing = eventId ? db.events.find((e) => e.id === eventId) : undefined;
  const activeCategories = db.eventCategories.filter((c) => c.isActive);

  const [title, setTitle] = useState(existing?.title ?? '');
  const [categoryId, setCategoryId] = useState(
    existing?.categoryId ?? activeCategories[0]?.id ?? '',
  );
  const [isAllDay, setAllDay] = useState(existing?.isAllDay ?? false);
  const [startDate, setStartDate] = useState(toDateInput(existing?.startsAt));
  const [startTime, setStartTime] = useState(toTimeInput(existing?.startsAt));
  const [endDate, setEndDate] = useState(toDateInput(existing?.endsAt ?? existing?.startsAt));
  const [endTime, setEndTime] = useState(toTimeInput(existing?.endsAt));
  const [location, setLocation] = useState(existing?.location ?? '');
  const [description, setDescription] = useState(existing?.description ?? '');
  const [hospitalId, setHospitalId] = useState<string | null>(existing?.hospitalId ?? null);
  const [surgeonId, setSurgeonId] = useState<string | null>(existing?.surgeonId ?? null);
  const [touched, setTouched] = useState(false);

  const startsAt = combine(startDate, isAllDay ? '00:00' : startTime);
  const endsAt = endDate.length > 0 ? combine(endDate, isAllDay ? '23:59' : endTime) : null;

  // FR-CAL-12 — an event cannot end before it starts; blocked at entry.
  const orderError =
    startsAt && endsAt && new Date(endsAt).getTime() < new Date(startsAt).getTime()
      ? 'The end must be after the start.'
      : undefined;

  const titleError = touched && title.trim().length === 0 ? 'A title is required.' : undefined;
  const startError = touched && !startsAt ? 'A valid start date is required.' : undefined;
  const valid =
    title.trim().length > 0 && startsAt !== null && categoryId.length > 0 && !orderError;

  // Surgeons are scoped to the linked hospital when one is chosen — FR-DIR-5 means
  // a surgeon implies exactly one hospital, so offering all of them would be wrong.
  const selectableSurgeons = useMemo(
    () => (hospitalId ? db.surgeons.filter((s) => s.hospitalId === hospitalId) : db.surgeons),
    [db.surgeons, hospitalId],
  );

  const save = () => {
    setTouched(true);
    if (!valid || !startsAt) return;
    const payload = {
      title: title.trim(),
      description: description.trim(),
      categoryId,
      startsAt,
      endsAt,
      isAllDay,
      location: location.trim(),
      hospitalId,
      surgeonId,
    };
    if (existing) {
      actions.updateEvent(existing.id, payload);
      router.back();
      return;
    }
    const id = actions.addEvent(payload, user.id);
    router.replace(`/calendar/event/${id}`);
  };

  return (
    <Screen
      header={<ScreenHeader title={existing ? 'Edit event' : 'New event'} showBack />}
      footer={
        <View style={styles.row}>
          <Button
            label="Cancel"
            variant="ghost"
            onPress={() => router.back()}
            style={styles.flex}
          />
          <Button
            label={existing ? 'Save' : 'Create event'}
            onPress={save}
            disabled={!valid}
            style={styles.flex}
          />
        </View>
      }
    >
      {!phiNoticeDismissed ? (
        <Banner
          tone="warning"
          title="Do not enter patient information"
          body="Event titles are the easiest place to cross this line. Name the surgeon or the block, never a patient."
          onDismiss={dismissPhiNotice}
        />
      ) : null}

      <Input
        label="Title"
        value={title}
        onChangeText={setTitle}
        placeholder="Dr. Arden block day — coverage needed"
        maxLength={TITLE_MAX}
        showCounter
        error={titleError}
        required
      />

      {/* FR-CAL-6 — categories come from the database, so this list is data-driven. */}
      <View style={styles.group}>
        <Text variant="label" tone="muted">
          Category *
        </Text>
        <View style={styles.chips}>
          {activeCategories.map((category) => (
            <Chip
              key={category.id}
              label={category.name}
              swatch={category.colorHex}
              selected={category.id === categoryId}
              onPress={() => setCategoryId(category.id)}
            />
          ))}
        </View>
      </View>

      <View style={styles.switchRow}>
        <View style={styles.flex}>
          <Text variant="bodyStrong">All day</Text>
          <Text variant="caption" tone="subtle">
            Hides the time fields and spans whole days.
          </Text>
        </View>
        <Switch
          value={isAllDay}
          onValueChange={setAllDay}
          accessibilityLabel="All-day event"
          trackColor={{ true: colors.primary, false: colors.borderStrong }}
        />
      </View>

      <SectionLabel>Starts</SectionLabel>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Input
            label="Date"
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            error={startError}
            required
          />
        </View>
        {!isAllDay ? (
          <View style={styles.timeField}>
            <Input label="Time" value={startTime} onChangeText={setStartTime} placeholder="09:00" />
          </View>
        ) : null}
      </View>

      <SectionLabel>Ends</SectionLabel>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Input
            label="Date"
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            error={orderError}
          />
        </View>
        {!isAllDay ? (
          <View style={styles.timeField}>
            <Input label="Time" value={endTime} onChangeText={setEndTime} placeholder="17:00" />
          </View>
        ) : null}
      </View>

      <Text variant="caption" tone="subtle">
        Typed dates stand in for the native date and time pickers, which arrive with the phone
        build. Times are stored with a timezone and shown in the reader&apos;s local time.
      </Text>

      <Input
        label="Location"
        value={location}
        onChangeText={setLocation}
        placeholder="Pinehurst Orthopedic Institute, OR 4"
        hint="Shown as a tappable address on the event."
      />

      <Input
        label="Description"
        value={description}
        onChangeText={setDescription}
        placeholder="What does the team need to know?"
        maxLength={DESCRIPTION_MAX}
        showCounter
        multiline
        minHeight={120}
      />

      {/* FR-CAL-5 — optional links to a hospital and/or a surgeon. */}
      <View style={styles.group}>
        <Text variant="label" tone="muted">
          Linked hospital
        </Text>
        <View style={styles.chips}>
          <Chip
            label="None"
            selected={hospitalId === null}
            onPress={() => {
              setHospitalId(null);
              setSurgeonId(null);
            }}
          />
          {db.hospitals.map((hospital) => (
            <Chip
              key={hospital.id}
              label={hospital.name}
              selected={hospital.id === hospitalId}
              onPress={() => {
                setHospitalId(hospital.id);
                setSurgeonId(null);
              }}
            />
          ))}
        </View>
      </View>

      <View style={styles.group}>
        <Text variant="label" tone="muted">
          Linked surgeon
        </Text>
        <View style={styles.chips}>
          <Chip label="None" selected={surgeonId === null} onPress={() => setSurgeonId(null)} />
          {selectableSurgeons.map((surgeon) => (
            <Chip
              key={surgeon.id}
              label={surgeonName(surgeon)}
              selected={surgeon.id === surgeonId}
              onPress={() => {
                setSurgeonId(surgeon.id);
                setHospitalId(surgeon.hospitalId);
              }}
            />
          ))}
        </View>
        <Text variant="caption" tone="subtle">
          {hospitalId
            ? 'Showing surgeons at the linked hospital.'
            : 'Choosing a surgeon links their hospital automatically.'}
        </Text>
      </View>

      <Text variant="caption" tone="subtle">
        Recurring events are not supported in this version — repeat a case day by creating each
        occurrence.
      </Text>
    </Screen>
  );
}

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toTimeInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

/** Returns null on anything unparseable, so validation can report it. */
function combine(date: string, time: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [year, month, day] = date.split('-').map(Number);
  if (year === undefined || month === undefined || day === undefined) return null;

  let hours = 0;
  let minutes = 0;
  if (/^\d{1,2}:\d{2}$/.test(time)) {
    const [h, m] = time.split(':').map(Number);
    hours = h ?? 0;
    minutes = m ?? 0;
  }

  const result = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  group: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  timeField: { width: 110 },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
});
