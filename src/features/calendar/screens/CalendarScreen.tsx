import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Screen } from '@/components/Screen';
import {
  Banner,
  Button,
  Chip,
  EmptyState,
  ScreenHeader,
  SearchField,
  SectionLabel,
  SegmentedControl,
  Text,
} from '@/components/ui';
import { dateLong, eventWhen, timeOnly } from '@/lib/format';
import { categoryById, eventsSorted, useData } from '@/lib/mock/store';
import type { CalendarEvent, EventCategory } from '@/lib/mock/types';
import { useSession } from '@/stores/session';
import { useUiPrefs, type CalendarView } from '@/stores/uiPrefs';
import { colors, radii, spacing } from '@/theme';

import {
  addMonths,
  coversDay,
  groupByDay,
  isFirstDayOf,
  isLastDayOf,
  isMultiDay,
  isSameMonth,
  isToday,
  monthGrid,
  monthLabel,
  startOfDay,
  WEEKDAY_INITIALS,
} from '../utils';

/** Shared company calendar — requirements §4.5. */
export function CalendarScreen() {
  const db = useData();
  const { isAdmin } = useSession();
  const { calendarView, setCalendarView, categoryFilter, toggleCategory, clearCategoryFilter } =
    useUiPrefs();

  // Read once at mount: the agenda's "upcoming" cutoff must not shift underneath
  // the list on an unrelated re-render.
  const [mountedAt] = useState(() => Date.now());
  const [month, setMonth] = useState(() => startOfDay(new Date()));
  const [selectedDay, setSelectedDay] = useState(() => startOfDay(new Date()));
  const [query, setQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeCategories = db.eventCategories.filter((c) => c.isActive);
  const allCategoryIds = activeCategories.map((c) => c.id);
  const filterActive = categoryFilter !== null;

  const events = useMemo(() => eventsSorted(db, categoryFilter), [db, categoryFilter]);

  // FR-CAL-8 — title search, chronological, past and future, filters respected.
  const needle = query.trim().toLowerCase();
  const searchResults = useMemo(
    () =>
      needle.length === 0 ? null : events.filter((e) => e.title.toLowerCase().includes(needle)),
    [events, needle],
  );

  const grid = useMemo(() => monthGrid(month), [month]);
  const dayEvents = useMemo(
    () => events.filter((e) => coversDay(e, selectedDay)),
    [events, selectedDay],
  );
  const upcoming = useMemo(
    () =>
      events.filter((e) => new Date(e.endsAt ?? e.startsAt).getTime() >= mountedAt - 86_400_000),
    [events, mountedAt],
  );

  return (
    <Screen
      scroll={false}
      padded={false}
      header={
        <ScreenHeader
          title="Calendar"
          subtitle={`${events.length} event${events.length === 1 ? '' : 's'}${filterActive ? ' · filtered' : ''}`}
          actions={[
            {
              icon: filterActive ? 'funnel' : 'funnel-outline',
              label: 'Filter by category',
              onPress: () => setFiltersOpen((open) => !open),
            },
            // FR-CAL-9 — the add affordance is absent for Standard users, not disabled.
            ...(isAdmin
              ? [
                  {
                    icon: 'add' as const,
                    label: 'New event',
                    onPress: () => router.push('/calendar/event/new'),
                  },
                ]
              : []),
          ]}
        />
      }
    >
      <View style={styles.controls}>
        {/* FR-CAL-3 — the choice persists. */}
        <SegmentedControl<CalendarView>
          value={calendarView}
          onChange={setCalendarView}
          options={[
            { value: 'month', label: 'Month' },
            { value: 'agenda', label: 'Agenda' },
          ]}
        />
        <SearchField value={query} onChangeText={setQuery} placeholder="Search event titles" />

        {filtersOpen ? (
          <View style={styles.filters}>
            <View style={styles.chips}>
              {activeCategories.map((category) => (
                <Chip
                  key={category.id}
                  label={category.name}
                  swatch={category.colorHex}
                  selected={categoryFilter === null || categoryFilter.includes(category.id)}
                  onPress={() => toggleCategory(category.id, allCategoryIds)}
                />
              ))}
            </View>
            {filterActive ? (
              <Button
                label="Show all categories"
                variant="ghost"
                size="sm"
                onPress={clearCategoryFilter}
              />
            ) : null}
          </View>
        ) : null}
      </View>

      {/* FR-CAL-7 — an active filter is unmistakable, so an empty view is never
          mistaken for an empty calendar. */}
      {filterActive ? (
        <View style={styles.inset}>
          <Banner
            tone="info"
            title="Filter active"
            body={`Showing ${categoryFilter.length} of ${activeCategories.length} categories. Some events are hidden.`}
            onDismiss={clearCategoryFilter}
          />
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.body}>
        {searchResults ? (
          <SearchList results={searchResults} db={db} query={query} />
        ) : calendarView === 'month' ? (
          <>
            <MonthHeader
              month={month}
              onPrevious={() => setMonth(addMonths(month, -1))}
              onNext={() => setMonth(addMonths(month, 1))}
              onToday={() => {
                const today = startOfDay(new Date());
                setMonth(today);
                setSelectedDay(today);
              }}
            />

            <View style={styles.weekdays}>
              {WEEKDAY_INITIALS.map((initial, index) => (
                <View key={index} style={styles.weekdayCell}>
                  <Text variant="micro" tone="subtle">
                    {initial}
                  </Text>
                </View>
              ))}
            </View>

            <View style={styles.grid}>
              {grid.map((week, weekIndex) => (
                <View key={weekIndex} style={styles.week}>
                  {week.map((day) => (
                    <DayCell
                      key={day.toISOString()}
                      day={day}
                      month={month}
                      events={events.filter((e) => coversDay(e, day))}
                      selected={startOfDay(day).getTime() === selectedDay.getTime()}
                      onPress={() => setSelectedDay(startOfDay(day))}
                      db={db}
                    />
                  ))}
                </View>
              ))}
            </View>

            {/* FR-CAL-2 — the selected day's events, listed below the grid. */}
            <SectionLabel>{dateLong(selectedDay.toISOString())}</SectionLabel>
            {dayEvents.length === 0 ? (
              <View style={styles.inset}>
                <Text variant="body" tone="muted">
                  Nothing scheduled on this day.
                </Text>
              </View>
            ) : (
              <View style={styles.eventList}>
                {dayEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    category={categoryById(db, event.categoryId)}
                  />
                ))}
              </View>
            )}
          </>
        ) : (
          <AgendaView events={upcoming} db={db} />
        )}
      </ScrollView>
    </Screen>
  );
}

function MonthHeader({
  month,
  onPrevious,
  onNext,
  onToday,
}: {
  month: Date;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
}) {
  return (
    <View style={styles.monthHeader}>
      <Pressable
        onPress={onPrevious}
        accessibilityRole="button"
        accessibilityLabel="Previous month"
        style={styles.monthNav}
      >
        <Ionicons name="chevron-back" size={20} color={colors.primary} />
      </Pressable>
      <Pressable
        onPress={onToday}
        accessibilityRole="button"
        accessibilityLabel="Jump to today"
        style={styles.monthTitle}
      >
        <Text variant="heading">{monthLabel(month)}</Text>
      </Pressable>
      <Pressable
        onPress={onNext}
        accessibilityRole="button"
        accessibilityLabel="Next month"
        style={styles.monthNav}
      >
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </Pressable>
    </View>
  );
}

function DayCell({
  day,
  month,
  events,
  selected,
  onPress,
  db,
}: {
  day: Date;
  month: Date;
  events: CalendarEvent[];
  selected: boolean;
  onPress: () => void;
  db: ReturnType<typeof useData>;
}) {
  const outside = !isSameMonth(day, month);
  const today = isToday(day);

  const spans = events.filter(isMultiDay).slice(0, 2);
  const dots = events.filter((e) => !isMultiDay(e));

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={`${day.getDate()}, ${events.length} event${events.length === 1 ? '' : 's'}`}
      style={[styles.dayCell, selected && styles.dayCellSelected]}
    >
      <View style={[styles.dayNumber, today && styles.dayNumberToday]}>
        <Text variant="caption" tone={today ? 'inverse' : outside ? 'subtle' : 'default'}>
          {day.getDate()}
        </Text>
      </View>

      <View style={styles.markers}>
        {/* FR-CAL-10 — a multi-day event renders as a continuous bar across its span. */}
        {spans.map((event) => {
          const category = categoryById(db, event.categoryId);
          return (
            <View
              key={event.id}
              style={[
                styles.bar,
                { backgroundColor: category?.colorHex ?? colors.textSubtle },
                isFirstDayOf(event, day) && styles.barStart,
                isLastDayOf(event, day) && styles.barEnd,
              ]}
            />
          );
        })}

        {dots.length > 0 ? (
          <View style={styles.dots}>
            {dots.slice(0, 3).map((event) => {
              const category = categoryById(db, event.categoryId);
              return (
                <View
                  key={event.id}
                  style={[styles.dot, { backgroundColor: category?.colorHex ?? colors.textSubtle }]}
                />
              );
            })}
            {dots.length > 3 ? (
              <Text variant="micro" tone="subtle">
                +{dots.length - 3}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

function EventRow({
  event,
  category,
}: {
  event: CalendarEvent;
  category: EventCategory | undefined;
}) {
  return (
    <Pressable
      onPress={() => router.push(`/calendar/event/${event.id}`)}
      accessibilityRole="button"
      accessibilityLabel={`${event.title}, ${category?.name ?? 'no category'}`}
      style={({ pressed }) => [styles.eventRow, pressed && styles.pressed]}
    >
      <View
        style={[styles.eventStripe, { backgroundColor: category?.colorHex ?? colors.border }]}
      />
      <View style={styles.eventCopy}>
        <Text variant="bodyStrong" numberOfLines={2}>
          {event.title}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {event.isAllDay ? 'All day' : timeOnly(event.startsAt)}
          {event.location ? ` · ${event.location}` : ''}
        </Text>
        {/* NFR-6 — the category is named, never conveyed by colour alone. */}
        <Text variant="micro" tone="subtle">
          {(category?.name ?? 'UNCATEGORISED').toUpperCase()}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
    </Pressable>
  );
}

function AgendaView({ events, db }: { events: CalendarEvent[]; db: ReturnType<typeof useData> }) {
  const grouped = useMemo(() => groupByDay(events), [events]);

  if (grouped.length === 0) {
    return (
      <EmptyState
        icon="calendar-outline"
        title="Nothing coming up"
        body="Upcoming events appear here. Events are created by administrators."
      />
    );
  }

  return (
    <>
      {grouped.map(({ day, events: dayEvents }) => (
        <View key={day.toISOString()}>
          <SectionLabel>
            {isToday(day) ? `Today · ${dateLong(day.toISOString())}` : dateLong(day.toISOString())}
          </SectionLabel>
          <View style={styles.eventList}>
            {dayEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                category={categoryById(db, event.categoryId)}
              />
            ))}
          </View>
        </View>
      ))}
    </>
  );
}

function SearchList({
  results,
  db,
  query,
}: {
  results: CalendarEvent[];
  db: ReturnType<typeof useData>;
  query: string;
}) {
  if (results.length === 0) {
    return (
      <EmptyState
        icon="search-outline"
        title="No events match"
        body={`Nothing matches "${query}". Search covers past and future events, and respects the category filter.`}
      />
    );
  }

  return (
    <>
      <SectionLabel>{`${results.length} result${results.length === 1 ? '' : 's'}`}</SectionLabel>
      <View style={styles.eventList}>
        {results.map((event) => (
          <View key={event.id} style={styles.searchRow}>
            <EventRow event={event} category={categoryById(db, event.categoryId)} />
            <Text variant="caption" tone="subtle" style={styles.searchWhen}>
              {eventWhen(event.startsAt, event.endsAt, event.isAllDay)}
            </Text>
          </View>
        ))}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  controls: {
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  filters: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  inset: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  body: { paddingBottom: spacing.xxxl },
  monthHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  monthNav: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { minHeight: 44, justifyContent: 'center' },
  weekdays: { flexDirection: 'row', paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  weekdayCell: { flex: 1, alignItems: 'center', paddingVertical: spacing.xs },
  grid: { paddingHorizontal: spacing.sm },
  week: { flexDirection: 'row' },
  dayCell: {
    flex: 1,
    minHeight: 54,
    alignItems: 'center',
    paddingTop: spacing.xs,
    paddingBottom: 2,
    borderRadius: radii.sm,
  },
  dayCellSelected: { backgroundColor: colors.primarySoft },
  dayNumber: {
    width: 24,
    height: 24,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberToday: { backgroundColor: colors.primary },
  markers: { alignSelf: 'stretch', gap: 2, paddingHorizontal: 2, marginTop: 2 },
  bar: { height: 4 },
  barStart: { borderTopLeftRadius: radii.pill, borderBottomLeftRadius: radii.pill, marginLeft: 2 },
  barEnd: { borderTopRightRadius: radii.pill, borderBottomRightRadius: radii.pill, marginRight: 2 },
  dots: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3 },
  dot: { width: 5, height: 5, borderRadius: radii.pill },
  eventList: { paddingHorizontal: spacing.lg, gap: spacing.sm },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    paddingRight: spacing.md,
    overflow: 'hidden',
    minHeight: 64,
  },
  pressed: { backgroundColor: colors.surfaceAlt },
  eventStripe: { width: 4, alignSelf: 'stretch' },
  eventCopy: { flex: 1, paddingVertical: spacing.md, gap: 1 },
  searchRow: { gap: 2 },
  searchWhen: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm },
});
