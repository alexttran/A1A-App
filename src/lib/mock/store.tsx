/**
 * Prototype data layer.
 *
 * Stands in for TanStack Query + Supabase so the prototype is genuinely
 * clickable: adds and edits persist for the life of the page, which is what
 * makes a layout review useful rather than a slideshow.
 *
 * Two behaviours here deliberately imitate the *server*, because they change the
 * screens and reviewers need to see them:
 *
 *   - Editing a preference card appends a revision row, the way the database
 *     trigger in requirements §7.4 does. History is never written by a screen.
 *   - Editing bumps `version`, so the concurrency conflict in FR-PREF-13 can be
 *     demonstrated (see `simulateConcurrentEdit`).
 *
 * Nothing here enforces permissions. Role checks in this tree hide affordances;
 * the real gate is row-level security (requirements NFR-3).
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { seed } from './data';
import type {
  Announcement,
  CalendarEvent,
  Database,
  DocumentFile,
  EventCategory,
  Folder,
  Hospital,
  PreferenceCard,
  PreferenceCardRevision,
  Role,
  Surgeon,
  User,
} from './types';

let idCounter = 0;
const newId = (prefix: string) => `${prefix}-new-${++idCounter}`;
const nowIso = () => new Date().toISOString();

type NewAnnouncement = Pick<Announcement, 'title' | 'body'>;
type NewHospital = Omit<Hospital, 'id'>;
type NewSurgeon = Omit<Surgeon, 'id'>;
type NewEvent = Omit<CalendarEvent, 'id' | 'createdBy' | 'createdAt'>;

export type SaveCardResult =
  | { ok: true }
  | {
      ok: false;
      reason: 'conflict';
      conflictedWith: string;
      theirTopic: string;
      theirBody: string;
    };

type Actions = {
  // Bulletin board
  addAnnouncement: (input: NewAnnouncement, authorId: string) => string;
  updateAnnouncement: (id: string, input: NewAnnouncement) => void;
  deleteAnnouncement: (id: string) => void;
  togglePin: (id: string) => void;

  // Directory
  addHospital: (input: NewHospital) => string;
  updateHospital: (id: string, input: NewHospital) => void;
  deleteHospital: (id: string) => void;
  addSurgeon: (input: NewSurgeon) => string;
  updateSurgeon: (id: string, input: NewSurgeon) => void;
  deleteSurgeon: (id: string) => void;

  // Preference cards
  addCard: (surgeonId: string, topic: string, body: string, userId: string) => string;
  /** Rejects on a version mismatch rather than overwriting — FR-PREF-13. */
  saveCard: (
    cardId: string,
    topic: string,
    body: string,
    expectedVersion: number,
    userId: string,
  ) => SaveCardResult;
  deleteCard: (cardId: string, userId: string) => void;
  /** Prototype affordance: fakes another rep saving first, to show the conflict. */
  simulateConcurrentEdit: (cardId: string, notUserId: string) => void;

  // Documents
  addFolder: (parentId: string | null, name: string, userId: string) => string;
  addDocument: (
    folderId: string | null,
    file: Pick<DocumentFile, 'name' | 'mimeType' | 'sizeBytes'>,
    userId: string,
  ) => string;
  renameFolder: (id: string, name: string) => void;
  renameDocument: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  deleteDocument: (id: string) => void;

  // Calendar
  addEvent: (input: NewEvent, userId: string) => string;
  updateEvent: (id: string, input: NewEvent) => void;
  deleteEvent: (id: string) => void;

  // Admin
  inviteUser: (email: string, fullName: string, role: Role) => string;
  setUserRole: (id: string, role: Role) => void;
  setUserActive: (id: string, isActive: boolean) => void;
  addCategory: (name: string, colorHex: string) => string;
  updateCategory: (
    id: string,
    patch: Partial<Pick<EventCategory, 'name' | 'colorHex' | 'isActive'>>,
  ) => void;
};

type Store = { db: Database; actions: Actions };

const DataContext = createContext<Store | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Database>(seed);

  const patch = useCallback((fn: (draft: Database) => Database) => setDb((prev) => fn(prev)), []);

  const actions = useMemo<Actions>(
    () => ({
      // -------------------------------------------------------------- bulletin
      addAnnouncement: (input, authorId) => {
        const id = newId('ann');
        patch((d) => ({
          ...d,
          announcements: [
            {
              id,
              title: input.title,
              body: input.body,
              authorId,
              isPinned: false,
              editedAt: null,
              createdAt: nowIso(),
            },
            ...d.announcements,
          ],
        }));
        return id;
      },
      updateAnnouncement: (id, input) =>
        patch((d) => ({
          ...d,
          announcements: d.announcements.map((a) =>
            a.id === id ? { ...a, ...input, editedAt: nowIso() } : a,
          ),
        })),
      deleteAnnouncement: (id) =>
        patch((d) => ({ ...d, announcements: d.announcements.filter((a) => a.id !== id) })),
      togglePin: (id) =>
        patch((d) => ({
          ...d,
          announcements: d.announcements.map((a) =>
            a.id === id ? { ...a, isPinned: !a.isPinned } : a,
          ),
        })),

      // ------------------------------------------------------------- directory
      addHospital: (input) => {
        const id = newId('hosp');
        patch((d) => ({ ...d, hospitals: [...d.hospitals, { id, ...input }] }));
        return id;
      },
      updateHospital: (id, input) =>
        patch((d) => ({
          ...d,
          hospitals: d.hospitals.map((h) => (h.id === id ? { ...h, ...input } : h)),
        })),
      deleteHospital: (id) =>
        patch((d) => ({
          ...d,
          hospitals: d.hospitals.filter((h) => h.id !== id),
          surgeons: d.surgeons.filter((s) => s.hospitalId !== id),
        })),
      addSurgeon: (input) => {
        const id = newId('srg');
        patch((d) => ({ ...d, surgeons: [...d.surgeons, { id, ...input }] }));
        return id;
      },
      updateSurgeon: (id, input) =>
        patch((d) => ({
          ...d,
          surgeons: d.surgeons.map((s) => (s.id === id ? { ...s, ...input } : s)),
        })),
      deleteSurgeon: (id) =>
        patch((d) => ({
          ...d,
          surgeons: d.surgeons.filter((s) => s.id !== id),
          // Cards are archived with the surgeon, not destroyed — FR-DIR-9, §7.3.
          preferenceCards: d.preferenceCards.map((c) =>
            c.surgeonId === id ? { ...c, isDeleted: true } : c,
          ),
        })),

      // ------------------------------------------------------- preference cards
      addCard: (surgeonId, topic, body, userId) => {
        const id = newId('pc');
        const at = nowIso();
        patch((d) => ({
          ...d,
          preferenceCards: [
            ...d.preferenceCards,
            {
              id,
              surgeonId,
              topic,
              body,
              version: 1,
              createdBy: userId,
              updatedBy: userId,
              createdAt: at,
              updatedAt: at,
              isDeleted: false,
            },
          ],
          preferenceCardRevisions: [
            ...d.preferenceCardRevisions,
            {
              id: `${id}-rev-1`,
              cardId: id,
              revisionNo: 1,
              action: 'created',
              topic,
              body,
              prevTopic: null,
              prevBody: null,
              changedBy: userId,
              changedAt: at,
            },
          ],
        }));
        return id;
      },

      saveCard: (cardId, topic, body, expectedVersion, userId) => {
        const card = db.preferenceCards.find((c) => c.id === cardId);
        if (!card) return { ok: true };

        if (card.version !== expectedVersion) {
          const other = db.users.find((u) => u.id === card.updatedBy);
          return {
            ok: false,
            reason: 'conflict',
            conflictedWith: other?.fullName ?? 'another user',
            theirTopic: card.topic,
            theirBody: card.body,
          };
        }

        const at = nowIso();
        const version = card.version + 1;
        patch((d) => ({
          ...d,
          preferenceCards: d.preferenceCards.map((c) =>
            c.id === cardId ? { ...c, topic, body, version, updatedBy: userId, updatedAt: at } : c,
          ),
          preferenceCardRevisions: [
            ...d.preferenceCardRevisions,
            {
              id: `${cardId}-rev-${version}`,
              cardId,
              revisionNo: version,
              action: 'edited',
              topic,
              body,
              prevTopic: card.topic,
              prevBody: card.body,
              changedBy: userId,
              changedAt: at,
            },
          ],
        }));
        return { ok: true };
      },

      deleteCard: (cardId, userId) => {
        const card = db.preferenceCards.find((c) => c.id === cardId);
        if (!card) return;
        const at = nowIso();
        const version = card.version + 1;
        patch((d) => ({
          ...d,
          preferenceCards: d.preferenceCards.map((c) =>
            c.id === cardId
              ? { ...c, isDeleted: true, version, updatedBy: userId, updatedAt: at }
              : c,
          ),
          preferenceCardRevisions: [
            ...d.preferenceCardRevisions,
            {
              id: `${cardId}-rev-${version}`,
              cardId,
              revisionNo: version,
              action: 'deleted',
              topic: card.topic,
              body: card.body,
              prevTopic: card.topic,
              prevBody: card.body,
              changedBy: userId,
              changedAt: at,
            },
          ],
        }));
      },

      simulateConcurrentEdit: (cardId, notUserId) => {
        const card = db.preferenceCards.find((c) => c.id === cardId);
        if (!card) return;
        // Anyone but the person sitting in front of the form — "you saved this
        // while you were editing" would read as a bug, not a demonstration.
        const other = db.users.find(
          (u) => u.id !== notUserId && u.id !== card.updatedBy && u.isActive && !u.isPending,
        );
        const at = nowIso();
        const version = card.version + 1;
        const body = `${card.body}\n\n(Edited by someone else while you had this open.)`;
        patch((d) => ({
          ...d,
          preferenceCards: d.preferenceCards.map((c) =>
            c.id === cardId
              ? { ...c, body, version, updatedBy: other?.id ?? c.updatedBy, updatedAt: at }
              : c,
          ),
          preferenceCardRevisions: [
            ...d.preferenceCardRevisions,
            {
              id: `${cardId}-rev-${version}`,
              cardId,
              revisionNo: version,
              action: 'edited',
              topic: card.topic,
              body,
              prevTopic: card.topic,
              prevBody: card.body,
              changedBy: other?.id ?? card.updatedBy,
              changedAt: at,
            },
          ],
        }));
      },

      // ------------------------------------------------------------- documents
      addFolder: (parentId, name, userId) => {
        const id = newId('fld');
        const parent = parentId ? db.folders.find((f) => f.id === parentId) : undefined;
        patch((d) => ({
          ...d,
          folders: [
            ...d.folders,
            {
              id,
              parentId,
              name,
              path: `${parent ? parent.path : '/'}${name}/`,
              depth: parent ? parent.depth + 1 : 0,
              createdBy: userId,
              createdAt: nowIso(),
            },
          ],
        }));
        return id;
      },
      addDocument: (folderId, file, userId) => {
        const id = newId('doc');
        patch((d) => ({
          ...d,
          documents: [
            ...d.documents,
            {
              id,
              folderId,
              name: file.name,
              storagePath: `documents/${id}`,
              mimeType: file.mimeType,
              sizeBytes: file.sizeBytes,
              uploadedBy: userId,
              createdAt: nowIso(),
            },
          ],
        }));
        return id;
      },
      renameFolder: (id, name) =>
        patch((d) => ({
          ...d,
          folders: d.folders.map((f) => (f.id === id ? { ...f, name } : f)),
        })),
      renameDocument: (id, name) =>
        patch((d) => ({
          ...d,
          documents: d.documents.map((doc) => (doc.id === id ? { ...doc, name } : doc)),
        })),
      deleteFolder: (id) =>
        patch((d) => {
          const doomed = new Set<string>([id]);
          let grew = true;
          while (grew) {
            grew = false;
            for (const f of d.folders) {
              if (f.parentId && doomed.has(f.parentId) && !doomed.has(f.id)) {
                doomed.add(f.id);
                grew = true;
              }
            }
          }
          return {
            ...d,
            folders: d.folders.filter((f) => !doomed.has(f.id)),
            documents: d.documents.filter((doc) => !doc.folderId || !doomed.has(doc.folderId)),
          };
        }),
      deleteDocument: (id) =>
        patch((d) => ({ ...d, documents: d.documents.filter((doc) => doc.id !== id) })),

      // -------------------------------------------------------------- calendar
      addEvent: (input, userId) => {
        const id = newId('evt');
        patch((d) => ({
          ...d,
          events: [...d.events, { id, ...input, createdBy: userId, createdAt: nowIso() }],
        }));
        return id;
      },
      updateEvent: (id, input) =>
        patch((d) => ({
          ...d,
          events: d.events.map((e) => (e.id === id ? { ...e, ...input } : e)),
        })),
      deleteEvent: (id) => patch((d) => ({ ...d, events: d.events.filter((e) => e.id !== id) })),

      // ----------------------------------------------------------------- admin
      inviteUser: (email, fullName, role) => {
        const id = newId('usr');
        patch((d) => ({
          ...d,
          users: [
            ...d.users,
            { id, email, fullName, role, isActive: true, createdAt: nowIso(), isPending: true },
          ],
        }));
        return id;
      },
      setUserRole: (id, role) =>
        patch((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, role } : u)) })),
      setUserActive: (id, isActive) =>
        patch((d) => ({ ...d, users: d.users.map((u) => (u.id === id ? { ...u, isActive } : u)) })),
      addCategory: (name, colorHex) => {
        const id = newId('cat');
        patch((d) => ({
          ...d,
          eventCategories: [
            ...d.eventCategories,
            { id, name, colorHex, sortOrder: d.eventCategories.length + 1, isActive: true },
          ],
        }));
        return id;
      },
      updateCategory: (id, changes) =>
        patch((d) => ({
          ...d,
          eventCategories: d.eventCategories.map((c) => (c.id === id ? { ...c, ...changes } : c)),
        })),
    }),
    [db, patch],
  );

  const value = useMemo<Store>(() => ({ db, actions }), [db, actions]);
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

function useStore(): Store {
  const store = useContext(DataContext);
  if (!store) throw new Error('useData must be used inside <AppDataProvider>');
  return store;
}

export function useData(): Database {
  return useStore().db;
}

export function useActions(): Actions {
  return useStore().actions;
}

// ---------------------------------------------------------------------------
// Selectors. Kept as plain functions over the database so they read the same way
// the eventual TanStack Query hooks will.
// ---------------------------------------------------------------------------

export function userName(db: Database, id: string): string {
  return db.users.find((u) => u.id === id)?.fullName ?? 'Unknown user';
}

export function hospitalById(db: Database, id: string | null): Hospital | undefined {
  return id ? db.hospitals.find((h) => h.id === id) : undefined;
}

export function surgeonById(db: Database, id: string | null): Surgeon | undefined {
  return id ? db.surgeons.find((s) => s.id === id) : undefined;
}

export function surgeonName(s: Surgeon): string {
  return `Dr. ${s.firstName} ${s.lastName}`;
}

export function categoryById(db: Database, id: string): EventCategory | undefined {
  return db.eventCategories.find((c) => c.id === id);
}

export function surgeonsForHospital(db: Database, hospitalId: string): Surgeon[] {
  return db.surgeons
    .filter((s) => s.hospitalId === hospitalId)
    .sort((a, b) => a.lastName.localeCompare(b.lastName));
}

/** FR-PREF-12 — most recently updated by default, alphabetical on toggle. */
export function cardsForSurgeon(
  db: Database,
  surgeonId: string,
  sort: 'recent' | 'alpha',
  includeDeleted = false,
): PreferenceCard[] {
  return db.preferenceCards
    .filter((c) => c.surgeonId === surgeonId && (includeDeleted || !c.isDeleted))
    .sort((a, b) =>
      sort === 'alpha'
        ? a.topic.localeCompare(b.topic)
        : new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
}

export function cardById(db: Database, id: string): PreferenceCard | undefined {
  return db.preferenceCards.find((c) => c.id === id);
}

/** Oldest to newest — FR-PREF-8. */
export function revisionsForCard(db: Database, cardId: string): PreferenceCardRevision[] {
  return db.preferenceCardRevisions
    .filter((r) => r.cardId === cardId)
    .sort((a, b) => a.revisionNo - b.revisionNo);
}

export function announcementsSorted(db: Database): {
  pinned: Announcement[];
  rest: Announcement[];
} {
  const byNewest = (a: Announcement, b: Announcement) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  return {
    pinned: db.announcements.filter((a) => a.isPinned).sort(byNewest),
    rest: db.announcements.filter((a) => !a.isPinned).sort(byNewest),
  };
}

export function childFolders(db: Database, parentId: string | null): Folder[] {
  return db.folders
    .filter((f) => f.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function childDocuments(db: Database, folderId: string | null): DocumentFile[] {
  return db.documents
    .filter((d) => d.folderId === folderId)
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Ancestors of `folderId`, root-first, for the breadcrumb trail (FR-DOC-2). */
export function breadcrumb(db: Database, folderId: string | null): Folder[] {
  const trail: Folder[] = [];
  let cursor = folderId;
  while (cursor) {
    const folder = db.folders.find((f) => f.id === cursor);
    if (!folder) break;
    trail.unshift(folder);
    cursor = folder.parentId;
  }
  return trail;
}

export function countFolderContents(db: Database, folderId: string): number {
  const ids = new Set<string>([folderId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const f of db.folders) {
      if (f.parentId && ids.has(f.parentId) && !ids.has(f.id)) {
        ids.add(f.id);
        grew = true;
      }
    }
  }
  const folders = ids.size - 1;
  const docs = db.documents.filter((d) => d.folderId && ids.has(d.folderId)).length;
  return folders + docs;
}

export function eventsSorted(db: Database, categoryIds: string[] | null): CalendarEvent[] {
  return db.events
    .filter((e) => !categoryIds || categoryIds.includes(e.categoryId))
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime());
}

/** A multi-day event counts as occurring on every day it spans — FR-CAL-10. */
export function eventsOnDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const dayStart = new Date(day);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return events.filter((e) => {
    const start = new Date(e.startsAt);
    const end = e.endsAt ? new Date(e.endsAt) : start;
    return start < dayEnd && end >= dayStart;
  });
}

export type { User };
