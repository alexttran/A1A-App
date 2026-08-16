# A1A Field App — Requirements

**Version:** 0.1 (draft)
**Last updated:** August 15, 2026
**Status:** Pending stakeholder sign-off

---

## 1. Overview

### 1.1 Purpose

A1A sells surgical parts and implants. Its field representatives work with a network of hospitals and surgeons, and the institutional knowledge about those relationships — what a given surgeon prefers, what documents apply to a given product line, what is happening this week — currently lives in email threads, text messages, and individual reps' heads.

This app is a centralized internal repository for that knowledge, delivered to phones so it is available in the field.

### 1.2 Scope of v1

Four functional areas:

| Area | Purpose |
|---|---|
| **Bulletin Board** | Company-wide announcements, posted and read in-app |
| **Directory & Preferences** | Hospitals → surgeons → per-surgeon preference cards, with full edit history |
| **Documents** | A shared, folder-based file repository for PDFs and images |
| **Calendar** | A shared event calendar with categories, filtering, and search |

### 1.3 Explicitly out of scope for v1

- Offline support (the app requires a network connection)
- Push notifications
- AI chatbot over document contents
- Inventory or part catalog management
- Case reports, expense tracking, or CRM functionality
- Any external (hospital-side or surgeon-side) user access
- Web or tablet-optimized layouts

Items 2 and 3 are planned for a later phase; see §10.

### 1.4 Critical constraint: no PHI

**This application must never store, transmit, or display protected health information (PHI).**

Hospitals and surgeons are business contacts, not patients. Nothing in this app is scoped to an individual patient. Because no PHI is present, the app is not subject to HIPAA, which meaningfully simplifies hosting, vendor agreements, and audit obligations.

This boundary is easy to cross by accident — a calendar event titled with a patient name, a preference card describing a specific case, a scanned document with a patient chart in it. Mitigations:

- Free-text fields (event titles, announcements, preference cards, document names) display an in-app reminder at first use per user: *"Do not enter patient information."*
- The admin onboarding materials state the rule explicitly.
- Admins can delete any content in any area (see §4.2) so violations can be removed quickly.
- If A1A later decides PHI must be supported, that is a re-architecture, not a feature — it requires a BAA with the hosting provider, encryption and audit requirements beyond what is specified here, and a fresh security review.

---

## 2. Users and roles

### 2.1 Audience

Internal A1A staff only. Fewer than 100 users total; assume ~40 at launch with room to grow. No self-signup — accounts are created by invitation.

### 2.2 Roles

Two roles: **Admin** and **Standard**.

| Capability | Standard | Admin |
|---|---|---|
| Log in, view all content | ✅ | ✅ |
| Post an announcement | ✅ | ✅ |
| Edit / delete **own** announcement | ✅ | ✅ |
| Edit / delete **any** announcement | ❌ | ✅ |
| Pin an announcement | ❌ | ✅ |
| Add / edit hospitals and surgeons | ❌ | ✅ |
| Add / edit preference cards | ✅ | ✅ |
| Delete a preference card | ❌ | ✅ |
| View preference card history | ✅ | ✅ |
| Create folders, upload documents | ✅ | ✅ |
| Delete / rename **own** upload | ✅ | ✅ |
| Delete / rename **any** document or folder | ❌ | ✅ |
| Create, edit, delete calendar events | ❌ | ✅ |
| Manage event categories | ❌ | ✅ |
| Invite, deactivate, and promote users | ❌ | ✅ |

> **Open question (Q1):** The table above assumes any user may post an announcement, which follows the original brief ("users can view and post announcements"). Given that calendar creation is admin-only, confirm whether announcements should also be admin-only.

> **Open question (Q2):** Confirm that Standard users should be able to delete their own documents/folders but not others'. The alternative — all deletion is admin-only — is safer for a shared file tree but adds friction.

### 2.3 Authentication

- Email and password.
- Accounts are created by an Admin sending an invitation to a company email address; the invitee sets their own password via an emailed link.
- Password reset by email link.
- Sessions persist across app launches (refresh token stored in the device secure store — Keychain on iOS, Keystore on Android). Sessions expire after 30 days of inactivity.
- Admins can deactivate a user, which immediately revokes their sessions. Deactivated users are retained (not deleted) so their authorship on historical content remains attributable.
- No MFA in v1. It is available from the auth provider and can be enabled later without code changes.

---

## 3. Platform and technical constraints

- **Client:** React Native via Expo, targeting iOS and Android phones.
- **Distribution:** Internal. TestFlight and Google Play internal testing track for the pilot; App Store / Play Store private distribution or an MDM push for general release. This is a business decision to confirm before launch — it affects review timelines.
- **Connectivity:** The app requires an internet connection. When offline it must display a clear, non-blocking banner rather than empty screens or spinners that never resolve. Failed writes surface an explicit error and preserve the user's unsaved input.
- **Minimum OS:** iOS 15+, Android 10+.
- **Orientation:** Portrait only.
- **Localization:** English only.
- **Timezones:** All timestamps stored as UTC; displayed in the device's local timezone. Calendar events are stored with a timezone and rendered in device-local time.

---

## 4. Functional requirements

Requirements are numbered `FR-<area>-<n>` for traceability.

### 4.1 Bulletin board

The landing screen after login.

| ID | Requirement |
|---|---|
| FR-BB-1 | Users see a reverse-chronological list of announcements. Pinned announcements appear above the rest, in their own section. |
| FR-BB-2 | Each list item shows title, author name, relative timestamp ("3 hours ago"), and a truncated preview of the body (~2 lines). |
| FR-BB-3 | Tapping an announcement opens a detail view with the full body. |
| FR-BB-4 | Users can create an announcement with a title (required, ≤ 140 chars) and a body (required, ≤ 5,000 chars). |
| FR-BB-5 | The body supports plain text with preserved line breaks. URLs are auto-detected and tappable. No rich text in v1. |
| FR-BB-6 | Authors can edit their own announcements. An edited announcement shows "edited <timestamp>". |
| FR-BB-7 | Authors can delete their own announcements; admins can delete any. Deletion is soft (see §7.3) and prompts for confirmation. |
| FR-BB-8 | Admins can pin and unpin announcements. There is no limit on pinned count, but the UI warns above 3. |
| FR-BB-9 | The list paginates, loading 20 at a time with infinite scroll, and supports pull-to-refresh. |

### 4.2 Directory: hospitals and surgeons

| ID | Requirement |
|---|---|
| FR-DIR-1 | Users can browse a searchable list of hospitals, sorted alphabetically. |
| FR-DIR-2 | A hospital record has: name (required), address, city, state, ZIP, main phone, and free-text notes. |
| FR-DIR-3 | Tapping a hospital opens its detail view, which shows its information and the list of surgeons affiliated with it. |
| FR-DIR-4 | A surgeon record has: first name (required), last name (required), hospital (required), specialty, phone, email, and free-text notes. |
| FR-DIR-5 | Each surgeon belongs to exactly one hospital. (Confirmed: multi-hospital affiliation is not needed.) |
| FR-DIR-6 | Users can search surgeons by name across all hospitals from a single search field, and see the hospital name in each result. |
| FR-DIR-7 | Only admins can create, edit, or delete hospitals and surgeons. |
| FR-DIR-8 | Phone numbers and email addresses are tappable, launching the dialer or mail client. Addresses are tappable, launching the device map app. |
| FR-DIR-9 | Deleting a surgeon requires confirmation and warns that N preference cards will be archived with them. |

### 4.3 Preference cards

The core value of the app. Each surgeon has a "folder" of preference cards, empty until users populate it.

| ID | Requirement |
|---|---|
| FR-PREF-1 | A surgeon's detail view contains a preferences section listing that surgeon's cards. A new surgeon starts with zero cards and displays an empty state prompting the first entry. |
| FR-PREF-2 | A preference card has a **topic** (required, ≤ 100 chars — e.g. "Glove size", "Preferred tray setup", "Communication style") and a **preference** body (required, ≤ 2,000 chars, multi-line plain text). |
| FR-PREF-3 | Any user (Standard or Admin) can add a card to any surgeon. |
| FR-PREF-4 | Any user can edit the topic and/or body of any existing card. |
| FR-PREF-5 | Only admins can delete a card. Deletion is soft; the card and its history are retained and remain viewable by admins. |
| FR-PREF-6 | Each card displays a summary line: "Last updated by <name>, <relative time>". |
| FR-PREF-7 | Each card has a **History** button opening a chronological history view. |
| FR-PREF-8 | The history view lists every revision, oldest to newest, showing: the action (Created / Edited / Deleted), who performed it, and when (absolute date and time). |
| FR-PREF-9 | Each history entry shows what the topic and body were set to at that revision. Where a field changed, the previous value is shown alongside the new one so the change is legible at a glance. |
| FR-PREF-10 | History is append-only and cannot be edited or deleted by any user, including admins. |
| FR-PREF-11 | Revisions are **not** revertible in v1. (Confirmed.) |
| FR-PREF-12 | Cards within a surgeon are ordered by most recently updated by default, with a toggle to sort alphabetically by topic. |
| FR-PREF-13 | If two users edit the same card concurrently, the second save is rejected with a "this card was updated by <name> while you were editing" message; the user's draft is preserved and they can re-apply it. |

### 4.4 Documents

A single shared file tree, visible to all users. Modeled loosely on Google Drive / SharePoint.

| ID | Requirement |
|---|---|
| FR-DOC-1 | One global folder tree. There is no per-user, per-hospital, or per-surgeon scoping in v1; every user sees every file. |
| FR-DOC-2 | Users can browse folders, with a breadcrumb trail showing the current path and allowing navigation to any ancestor. |
| FR-DOC-3 | Users can create folders at any level. Folder names must be unique among their siblings, ≤ 100 chars. Nesting depth is capped at 10. |
| FR-DOC-4 | Users can upload files into the current folder, choosing from device files or the photo library, and can take a photo directly. |
| FR-DOC-5 | Accepted types: PDF (`application/pdf`), JPEG, PNG, HEIC. Other types are rejected with a clear message. |
| FR-DOC-6 | Maximum file size is 50 MB. Files exceeding this are rejected before upload begins. |
| FR-DOC-7 | Uploads show live progress and can be cancelled. A failed upload can be retried without re-selecting the file. |
| FR-DOC-8 | Tapping a PDF opens an in-app viewer supporting scroll, pinch-zoom, and page navigation. Tapping an image opens a full-screen viewer with pinch-zoom. |
| FR-DOC-9 | Users can share or export a file via the OS share sheet. |
| FR-DOC-10 | Users can rename and delete their own uploads and folders they created; admins can rename and delete anything. Deleting a non-empty folder requires typed confirmation and warns of the item count. |
| FR-DOC-11 | Search returns files and folders by name, scoped to the entire tree, not just the current folder. Full-text search *inside* documents is out of scope for v1 (see §10.2). |
| FR-DOC-12 | Each file displays its name, type icon, size, uploader, and upload date. |
| FR-DOC-13 | Files are served over authenticated, time-limited URLs. A file URL must not be publicly accessible without a valid session. |

### 4.5 Calendar

| ID | Requirement |
|---|---|
| FR-CAL-1 | One global calendar. All users see all events. |
| FR-CAL-2 | Default view is a month grid with dots or bars indicating events, in their category color. Selecting a day shows that day's events in a list below the grid. |
| FR-CAL-3 | A secondary agenda view lists upcoming events chronologically. Users can toggle between month and agenda views; the choice persists. |
| FR-CAL-4 | An event has: title (required, ≤ 140 chars), category (required), start date/time (required), end date/time, all-day flag, location, and description (≤ 2,000 chars). |
| FR-CAL-5 | An event may optionally be linked to a hospital and/or a surgeon. If linked, the event detail deep-links to that record. |
| FR-CAL-6 | Three categories ship at launch: **Red**, **Green**, **Blue**. Categories are stored as data, not hardcoded, so admins can rename them, change their colors, and add more without a new app release. |
| FR-CAL-7 | Users can filter the calendar by one or more categories. Filter state persists across app sessions and is clearly indicated when active (so users don't mistake a filtered view for an empty calendar). |
| FR-CAL-8 | Users can search events by title. Search results are a chronological list, respect active category filters, and cover past as well as future events. |
| FR-CAL-9 | Only admins can create, edit, or delete events. Standard users have read-only access, and the "add" affordance is hidden for them rather than shown-and-disabled. |
| FR-CAL-10 | Multi-day events render across their full span in the month view. |
| FR-CAL-11 | Recurring events are out of scope for v1. |
| FR-CAL-12 | Events cannot end before they start; validation blocks this at entry. |

### 4.6 Admin

| ID | Requirement |
|---|---|
| FR-ADM-1 | Admins can view all users, with role and status. |
| FR-ADM-2 | Admins can invite a new user by email, assigning a role at invitation. |
| FR-ADM-3 | Admins can change a user's role and deactivate/reactivate a user. |
| FR-ADM-4 | An admin cannot remove their own admin role, and the system prevents removing the last remaining admin. |
| FR-ADM-5 | Admins can add, rename, recolor, and deactivate event categories. Deactivating a category preserves existing events, which retain their category but no longer appear as a filter option unless in use. |

---

## 5. Non-functional requirements

| ID | Requirement |
|---|---|
| NFR-1 | **Performance.** Any list screen renders its first page within 2 s on a 4G connection. Navigation between already-loaded screens is instant. |
| NFR-2 | **Perceived performance.** All network reads show skeleton loaders, not blank screens. All writes update the UI optimistically where safe and roll back on failure. |
| NFR-3 | **Security.** Authorization is enforced server-side via row-level security policies. Client-side role checks are for UX only and are never the sole gate. |
| NFR-4 | **Transport.** All traffic over TLS 1.2+. No secrets, API keys, or service credentials in the app bundle. |
| NFR-5 | **Data retention.** Deletions are soft; records are flagged and hidden, not destroyed. Hard deletion is a manual database operation. |
| NFR-6 | **Accessibility.** Minimum 4.5:1 text contrast, 44×44pt touch targets, screen-reader labels on all interactive elements, and support for the OS dynamic type setting. Category colors are never the only signal — every color-coded element also carries a text label. |
| NFR-7 | **Error handling.** Every failure state produces a human-readable message and a retry path. No raw error codes surfaced to users. |
| NFR-8 | **Observability.** Client crash reporting and server error logging from day one. |
| NFR-9 | **Scale.** Designed for < 100 users, < 10,000 documents, < 50 GB storage. No horizontal scaling requirements. |
| NFR-10 | **Auditability.** Preference card revisions are immutable and permanent. Author attribution survives user deactivation. |

---

## 6. Recommended technology stack

### 6.1 Backend decision — and why not Java

Java (Spring Boot) is a reasonable choice and would work fine, but it is not the best fit here unless A1A already employs Java developers who will own this long-term. This app is CRUD, file storage, authentication, and an audit log. None of that plays to the JVM's strengths, and Spring imposes significant boilerplate and infrastructure work to deliver capabilities that are available off the shelf elsewhere.

**Recommendation: Supabase** (managed Postgres with built-in authentication, object storage, row-level security, and Edge Functions).

The fit is unusually good for this specific set of requirements:

- **Auth with roles** — invitations, password reset, and session management are built in (§2.3).
- **File storage with access control** — signed, expiring URLs satisfy FR-DOC-13 without writing a file-serving layer.
- **Row-level security** — the permission matrix in §2.2 maps almost one-to-one onto Postgres RLS policies, enforced at the database, satisfying NFR-3 in a way that is hard to accidentally bypass.
- **Audit history via database triggers** — the preference card revision log (FR-PREF-7 through FR-PREF-10) becomes a ~20-line trigger that cannot be bypassed by application code.
- **pgvector for the future chatbot** — the planned AI feature (§10.2) needs a vector store. Having one in the same database as the documents removes an entire piece of future infrastructure.
- **One language** — TypeScript across client and the small amount of custom server logic, with generated types shared between them.

The escape hatch matters too: underneath, it is standard Postgres. If A1A outgrows the platform or wants to bring hosting in-house, the data moves with a `pg_dump`.

**Alternative worth considering:** NestJS + Prisma + Postgres, if A1A wants no vendor coupling and expects a larger engineering team. NestJS's module/DI/decorator structure will feel familiar to anyone coming from Spring. It costs perhaps 3–4 additional weeks of foundational work versus Supabase, in exchange for full control.

**Recommended against for this project:** Spring Boot, Django, Rails — all capable, all more setup than this workload justifies given the team size and the TypeScript-native frontend.

### 6.2 Stack summary

| Layer | Choice | Notes |
|---|---|---|
| App framework | Expo (SDK 52+), React Native, TypeScript | Custom dev client required, not Expo Go — see §8.1 |
| Navigation | Expo Router | File-based routing, typed routes |
| Server state | TanStack Query | Caching, retries, optimistic updates, pagination |
| Client state | Zustand | Small footprint; auth session and UI preferences only |
| Forms & validation | React Hook Form + Zod | Zod schemas shared with server-side validation |
| UI | Tamagui *or* React Native Paper | Decide in Phase 0; Paper is faster to start, Tamagui gives more design control |
| Calendar UI | `react-native-calendars` | Mature; supports multi-dot and period marking for FR-CAL-2/10 |
| PDF viewing | `react-native-pdf` + `react-native-blob-util` | Native modules; requires dev client |
| File picking | `expo-document-picker`, `expo-image-picker`, `expo-camera` | |
| Backend | Supabase — Postgres, Auth, Storage, Edge Functions | |
| Build & release | EAS Build + EAS Update | Over-the-air updates for JS-only changes |
| Monitoring | Sentry (client + server) | |

---

## 7. Data model

### 7.1 Tables

```
users                     -- mirrors auth provider users
  id                uuid pk
  email             text unique not null
  full_name         text not null
  role              text not null check (role in ('admin','standard'))
  is_active         boolean not null default true
  created_at        timestamptz not null default now()

hospitals
  id                uuid pk
  name              text not null
  address, city, state, zip, phone   text
  notes             text
  is_deleted        boolean not null default false
  created_at, updated_at             timestamptz

surgeons
  id                uuid pk
  hospital_id       uuid not null references hospitals(id)
  first_name        text not null
  last_name         text not null
  specialty, phone, email            text
  notes             text
  is_deleted        boolean not null default false
  created_at, updated_at             timestamptz

preference_cards
  id                uuid pk
  surgeon_id        uuid not null references surgeons(id)
  topic             text not null
  body              text not null
  version           integer not null default 1   -- for optimistic concurrency (FR-PREF-13)
  created_by        uuid not null references users(id)
  updated_by        uuid not null references users(id)
  is_deleted        boolean not null default false
  created_at, updated_at             timestamptz

preference_card_revisions            -- append-only, written by trigger
  id                uuid pk
  card_id           uuid not null references preference_cards(id)
  revision_no       integer not null
  action            text not null check (action in ('created','edited','deleted'))
  topic             text not null    -- value AFTER this revision
  body              text not null    -- value AFTER this revision
  prev_topic        text             -- null on 'created'
  prev_body         text             -- null on 'created'
  changed_by        uuid not null references users(id)
  changed_at        timestamptz not null default now()
  unique (card_id, revision_no)

announcements
  id                uuid pk
  title             text not null
  body              text not null
  author_id         uuid not null references users(id)
  is_pinned         boolean not null default false
  is_deleted        boolean not null default false
  edited_at         timestamptz
  created_at, updated_at             timestamptz

folders
  id                uuid pk
  parent_id         uuid references folders(id)   -- null = root
  name              text not null
  path              text not null                 -- materialized, e.g. '/Product Specs/2026/'
  depth             integer not null default 0
  created_by        uuid not null references users(id)
  is_deleted        boolean not null default false
  created_at        timestamptz
  unique (parent_id, name) where not is_deleted

documents
  id                uuid pk
  folder_id         uuid references folders(id)   -- null = root
  name              text not null
  storage_path      text not null unique
  mime_type         text not null
  size_bytes        bigint not null check (size_bytes <= 52428800)
  uploaded_by       uuid not null references users(id)
  is_deleted        boolean not null default false
  created_at        timestamptz

event_categories
  id                uuid pk
  name              text not null       -- 'Red', 'Green', 'Blue' at launch
  color_hex         text not null
  sort_order        integer not null
  is_active         boolean not null default true

events
  id                uuid pk
  title             text not null
  description       text
  category_id       uuid not null references event_categories(id)
  starts_at         timestamptz not null
  ends_at           timestamptz
  is_all_day        boolean not null default false
  location          text
  hospital_id       uuid references hospitals(id)
  surgeon_id        uuid references surgeons(id)
  created_by        uuid not null references users(id)
  is_deleted        boolean not null default false
  created_at, updated_at             timestamptz
  check (ends_at is null or ends_at >= starts_at)
```

### 7.2 Indexes

- `surgeons (hospital_id)`, `surgeons (last_name, first_name)`
- `preference_cards (surgeon_id, updated_at desc)`
- `preference_card_revisions (card_id, revision_no)`
- `announcements (is_pinned desc, created_at desc)`
- `documents (folder_id, name)`, `folders (parent_id, name)`
- `events (starts_at)`, `events (category_id, starts_at)`
- Trigram indexes on `surgeons(last_name)`, `documents(name)`, `folders(name)`, `events(title)` for fuzzy search

### 7.3 Soft deletion

Every content table carries `is_deleted`. RLS policies filter deleted rows from all standard reads. This preserves referential integrity for the revision log and keeps authorship attribution intact when content is removed. A quarterly hard-purge job can be added later if storage becomes a concern.

### 7.4 Revision trigger

`preference_card_revisions` is populated by an `AFTER INSERT OR UPDATE OR DELETE` trigger on `preference_cards`. The table has no `INSERT`/`UPDATE`/`DELETE` grants for any application role, satisfying FR-PREF-10 structurally rather than by convention.

---

## 8. Known risks

### 8.1 PDF viewing requires a custom dev client

`react-native-pdf` is a native module and will not run in Expo Go. The project must use an EAS-built custom development client from Phase 0 onward. This is a one-time setup cost, but discovering it in Phase 3 instead of Phase 0 would be disruptive. **Mitigation:** build the dev client during Phase 0 and verify PDF rendering with a throwaway screen before committing to the library.

### 8.2 Large uploads on cellular connections

A 50 MB upload over a weak hospital connection will be slow and may fail. **Mitigation:** resumable uploads, visible progress, cancel and retry (FR-DOC-7), and a warning when uploading a file over 10 MB while not on Wi-Fi.

### 8.3 Preference cards are the app's real value

Everything else here is standard. If the preference card flow — adding, editing, and reading history — is even slightly awkward, reps will keep using text messages and the app fails regardless of how good the rest is. **Mitigation:** prototype this flow first with real users before building the other three areas, and treat its usability as a launch gate.

### 8.4 An empty app is an abandoned app

Every area starts empty. The documents tree and surgeon list in particular need seeding before launch. **Mitigation:** a content-loading task in Phase 6 with a named owner, not a developer task.

### 8.5 Free-text fields and the PHI boundary

See §1.4. This is a training and moderation problem more than a technical one.

---

## 9. Open questions

| # | Question | Blocking |
|---|---|---|
| Q1 | Should announcement posting be admin-only, matching the calendar? | Phase 1 |
| Q2 | Should document/folder deletion be admin-only, or can users delete their own? | Phase 3 |
| Q3 | Distribution: App Store/Play private listing, or MDM? Affects launch timeline. | Phase 6 |
| Q4 | What are the real category names intended to replace Red/Green/Blue? Not blocking (they're editable data), but useful for the pilot. | — |
| Q5 | Is there an existing source — spreadsheet, CRM export — for the hospital and surgeon lists that could be imported rather than hand-entered? | Phase 2 |
| Q6 | Who owns content seeding before launch? | Phase 6 |

---

## 10. Planned future work

Not in v1, but the v1 architecture should not preclude these.

### 10.1 Push notifications for announcements

When an announcement is posted, notify all active users.

**Approach:** `expo-notifications` for device token registration; a `user_devices` table storing tokens; a database trigger or Edge Function on announcement insert that calls Expo's push API. Per-user notification preferences and an in-app notification center are natural companions.

**v1 hooks to include now:** a `user_devices` table can be added later without migration pain, but capturing `created_at` on announcements and keeping the `is_active` flag on users (both already specified) is what the notification fan-out will read from.

### 10.2 AI chatbot over document contents

Users ask a question in natural language; the assistant answers from the content of the uploaded PDFs and documents, with citations back to the source file.

**Approach:** retrieval-augmented generation.

1. On upload, extract text from the document. **Note:** scanned PDFs contain no text layer and require OCR — this is the main hidden cost of the feature, and a significant fraction of the documents in a business like this are likely to be scans.
2. Chunk the extracted text (~500–1,000 tokens with overlap) and store chunks with embeddings in a `document_chunks` table using pgvector.
3. At query time, embed the question, retrieve the top-k chunks by cosine similarity, and pass them to an LLM with a prompt instructing it to answer only from the supplied context and to cite the source documents.
4. Render answers with tappable citations that deep-link to the source file in the documents area.

**Why v1's design already supports this:** documents are globally readable, so there is no per-user retrieval filtering to build. Choosing Postgres puts the vector index in the same database as the document metadata. And storing `storage_path` and `mime_type` per document gives the extraction pipeline everything it needs.

**Caveat to set expectations early:** answer quality is bounded by document quality. A well-organized, text-native document set produces a useful assistant; a pile of scanned faxes produces a frustrating one. Prioritize §8.4's content seeding accordingly.

### 10.3 Other candidates

- Offline read-only cache of surgeon preferences (the highest-value offline scenario: no signal in a hospital basement before a case)
- Full-text search inside document contents (a byproduct of 10.2's text extraction)
- Per-hospital or per-region document scoping, if the global tree becomes unwieldy
- Revertible preference card revisions
- Recurring calendar events and calendar subscription feeds
- Web companion app for desk-based staff — the backend as designed already supports this