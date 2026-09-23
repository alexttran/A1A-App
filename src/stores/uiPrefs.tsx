/**
 * UI preferences that outlive a screen.
 *
 * Every value here is required to persist across app sessions — the calendar view
 * choice (FR-CAL-3), the category filter (FR-CAL-7), and the once-per-user PHI
 * reminder (§1.4) — so they are written through the storage shim rather than held
 * in memory. Writes happen in the setters, never in an effect.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { readJson, readValue, STORAGE_KEYS, writeJson, writeValue } from '@/lib/storage';

export type CalendarView = 'month' | 'agenda';
export type CardSort = 'recent' | 'alpha';

type UiPrefs = {
  calendarView: CalendarView;
  setCalendarView: (view: CalendarView) => void;

  /** null = no filter (all categories). FR-CAL-7. */
  categoryFilter: string[] | null;
  toggleCategory: (id: string, allIds: string[]) => void;
  clearCategoryFilter: () => void;

  cardSort: CardSort;
  setCardSort: (sort: CardSort) => void;

  /** §1.4 — shown once per user, across the free-text surfaces. */
  phiNoticeDismissed: boolean;
  dismissPhiNotice: () => void;

  /** Prototype affordance for reviewing the offline banner (§3). */
  isOffline: boolean;
  setOffline: (offline: boolean) => void;
};

const UiPrefsContext = createContext<UiPrefs | null>(null);

export function UiPrefsProvider({ children }: { children: ReactNode }) {
  const [calendarView, setCalendarViewState] = useState<CalendarView>(() =>
    readValue(STORAGE_KEYS.calendarView) === 'agenda' ? 'agenda' : 'month',
  );
  const [categoryFilter, setCategoryFilter] = useState<string[] | null>(() =>
    readJson<string[] | null>(STORAGE_KEYS.categoryFilter, null),
  );
  const [cardSort, setCardSortState] = useState<CardSort>(() =>
    readValue(STORAGE_KEYS.cardSort) === 'alpha' ? 'alpha' : 'recent',
  );
  const [phiNoticeDismissed, setPhiDismissed] = useState(
    () => readValue(STORAGE_KEYS.phiNotice) === 'true',
  );
  // Deliberately not persisted — it is a review toggle, not a user preference.
  const [isOffline, setOffline] = useState(false);

  const setCalendarView = useCallback((view: CalendarView) => {
    writeValue(STORAGE_KEYS.calendarView, view);
    setCalendarViewState(view);
  }, []);

  const setCardSort = useCallback((sort: CardSort) => {
    writeValue(STORAGE_KEYS.cardSort, sort);
    setCardSortState(sort);
  }, []);

  const toggleCategory = useCallback((id: string, allIds: string[]) => {
    setCategoryFilter((prev) => {
      const current = prev ?? allIds;
      const next = current.includes(id) ? current.filter((c) => c !== id) : [...current, id];
      // Selecting everything is the same as no filter — keep the state honest so
      // the "filter active" indicator does not lie.
      const resolved = next.length === allIds.length ? null : next;
      writeJson(STORAGE_KEYS.categoryFilter, resolved);
      return resolved;
    });
  }, []);

  const clearCategoryFilter = useCallback(() => {
    writeJson(STORAGE_KEYS.categoryFilter, null);
    setCategoryFilter(null);
  }, []);

  const dismissPhiNotice = useCallback(() => {
    writeValue(STORAGE_KEYS.phiNotice, 'true');
    setPhiDismissed(true);
  }, []);

  const value = useMemo<UiPrefs>(
    () => ({
      calendarView,
      setCalendarView,
      categoryFilter,
      toggleCategory,
      clearCategoryFilter,
      cardSort,
      setCardSort,
      phiNoticeDismissed,
      dismissPhiNotice,
      isOffline,
      setOffline,
    }),
    [
      calendarView,
      setCalendarView,
      categoryFilter,
      toggleCategory,
      clearCategoryFilter,
      cardSort,
      setCardSort,
      phiNoticeDismissed,
      dismissPhiNotice,
      isOffline,
    ],
  );

  return <UiPrefsContext.Provider value={value}>{children}</UiPrefsContext.Provider>;
}

export function useUiPrefs(): UiPrefs {
  const prefs = useContext(UiPrefsContext);
  if (!prefs) throw new Error('useUiPrefs must be used inside <UiPrefsProvider>');
  return prefs;
}
