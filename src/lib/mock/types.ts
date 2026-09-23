/**
 * Prototype domain types.
 *
 * These mirror the tables in requirements §7.1 one-to-one, in camelCase. When the
 * Supabase client lands they are replaced by the generated database types — the
 * shape is deliberately identical so the screens do not change.
 */

export type Role = 'admin' | 'standard';
export type RevisionAction = 'created' | 'edited' | 'deleted';

export type User = {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  isActive: boolean;
  createdAt: string;
  /** Not in the schema — prototype only, so invitees can be shown as pending. */
  isPending?: boolean;
};

export type Hospital = {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
  notes: string;
};

export type Surgeon = {
  id: string;
  hospitalId: string;
  firstName: string;
  lastName: string;
  specialty: string;
  phone: string;
  email: string;
  notes: string;
};

export type PreferenceCard = {
  id: string;
  surgeonId: string;
  topic: string;
  body: string;
  /** Optimistic-concurrency token — FR-PREF-13. */
  version: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
};

export type PreferenceCardRevision = {
  id: string;
  cardId: string;
  revisionNo: number;
  action: RevisionAction;
  /** Value AFTER this revision. */
  topic: string;
  body: string;
  /** Null on 'created'. */
  prevTopic: string | null;
  prevBody: string | null;
  changedBy: string;
  changedAt: string;
};

export type Announcement = {
  id: string;
  title: string;
  body: string;
  authorId: string;
  isPinned: boolean;
  editedAt: string | null;
  createdAt: string;
};

export type Folder = {
  id: string;
  parentId: string | null;
  name: string;
  path: string;
  depth: number;
  createdBy: string;
  createdAt: string;
};

export type DocumentFile = {
  id: string;
  folderId: string | null;
  name: string;
  storagePath: string;
  mimeType: 'application/pdf' | 'image/jpeg' | 'image/png' | 'image/heic';
  sizeBytes: number;
  uploadedBy: string;
  createdAt: string;
};

export type EventCategory = {
  id: string;
  name: string;
  colorHex: string;
  sortOrder: number;
  isActive: boolean;
};

export type CalendarEvent = {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  startsAt: string;
  endsAt: string | null;
  isAllDay: boolean;
  location: string;
  hospitalId: string | null;
  surgeonId: string | null;
  createdBy: string;
  createdAt: string;
};

export type Database = {
  users: User[];
  hospitals: Hospital[];
  surgeons: Surgeon[];
  preferenceCards: PreferenceCard[];
  preferenceCardRevisions: PreferenceCardRevision[];
  announcements: Announcement[];
  folders: Folder[];
  documents: DocumentFile[];
  eventCategories: EventCategory[];
  events: CalendarEvent[];
};
