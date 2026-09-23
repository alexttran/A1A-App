/**
 * Seed data for the prototype.
 *
 * Timestamps are generated relative to load time so "3 hours ago" stays honest
 * no matter when the prototype is opened, and calendar events always land in the
 * current month.
 *
 * NO PHI (requirements §1.4). Every surgeon and hospital below is invented, and
 * nothing here is scoped to a patient — that is exactly the boundary this seed
 * data is meant to demonstrate to reviewers.
 */

import type { Database } from './types';

const NOW = Date.now();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const ago = (ms: number) => new Date(NOW - ms).toISOString();

/** Day `offset` of the current month at `hour`:`minute`, device-local. */
function thisMonth(day: number, hour = 9, minute = 0): string {
  const d = new Date(NOW);
  d.setDate(day);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

const today = new Date(NOW).getDate();

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export const USERS = {
  dana: 'usr-dana',
  marcus: 'usr-marcus',
  priya: 'usr-priya',
  tom: 'usr-tom',
  elena: 'usr-elena',
  jordan: 'usr-jordan',
  wes: 'usr-wes',
  casey: 'usr-casey',
} as const;

const users: Database['users'] = [
  {
    id: USERS.dana,
    email: 'dana.whitfield@a1asurgical.com',
    fullName: 'Dana Whitfield',
    role: 'admin',
    isActive: true,
    createdAt: ago(400 * DAY),
  },
  {
    id: USERS.marcus,
    email: 'marcus.reyes@a1asurgical.com',
    fullName: 'Marcus Reyes',
    role: 'standard',
    isActive: true,
    createdAt: ago(330 * DAY),
  },
  {
    id: USERS.priya,
    email: 'priya.nandakumar@a1asurgical.com',
    fullName: 'Priya Nandakumar',
    role: 'standard',
    isActive: true,
    createdAt: ago(290 * DAY),
  },
  {
    id: USERS.tom,
    email: 'tom.gallagher@a1asurgical.com',
    fullName: 'Tom Gallagher',
    role: 'admin',
    isActive: true,
    createdAt: ago(380 * DAY),
  },
  {
    id: USERS.elena,
    email: 'elena.brandt@a1asurgical.com',
    fullName: 'Elena Brandt',
    role: 'standard',
    isActive: true,
    createdAt: ago(120 * DAY),
  },
  {
    id: USERS.jordan,
    email: 'jordan.pace@a1asurgical.com',
    fullName: 'Jordan Pace',
    role: 'standard',
    isActive: true,
    createdAt: ago(64 * DAY),
  },
  {
    id: USERS.wes,
    email: 'wes.okafor@a1asurgical.com',
    fullName: 'Wes Okafor',
    role: 'standard',
    isActive: false,
    createdAt: ago(500 * DAY),
  },
  {
    id: USERS.casey,
    email: 'casey.lindqvist@a1asurgical.com',
    fullName: 'Casey Lindqvist',
    role: 'standard',
    isActive: true,
    createdAt: ago(2 * DAY),
    isPending: true,
  },
];

// ---------------------------------------------------------------------------
// Hospitals and surgeons
// ---------------------------------------------------------------------------

const H = {
  stAgnes: 'hosp-st-agnes',
  lakeshore: 'hosp-lakeshore',
  mercyWest: 'hosp-mercy-west',
  pinehurst: 'hosp-pinehurst',
  riverbend: 'hosp-riverbend',
  crestview: 'hosp-crestview',
} as const;

const hospitals: Database['hospitals'] = [
  {
    id: H.stAgnes,
    name: 'St. Agnes Regional Medical Center',
    address: '4120 Halloran Parkway',
    city: 'Dayton',
    state: 'OH',
    zip: '45402',
    phone: '(937) 555-0142',
    notes:
      'Loading dock on the north side, badge required after 6pm. Ortho ORs are on 4 West; the sterile processing lead is Renata (ext. 2218).',
  },
  {
    id: H.lakeshore,
    name: 'Lakeshore University Hospital',
    address: '88 Lakefront Drive',
    city: 'Cleveland',
    state: 'OH',
    zip: '44114',
    phone: '(216) 555-0197',
    notes:
      'Teaching hospital — expect residents in the room. Vendor credentialing runs through Vendormate and takes 48h to clear.',
  },
  {
    id: H.mercyWest,
    name: 'Mercy West Surgical Pavilion',
    address: '2201 Tanner Ridge Road',
    city: 'Cincinnati',
    state: 'OH',
    zip: '45211',
    phone: '(513) 555-0110',
    notes: 'Ambulatory only. No overnight cases, so schedule tray drops before 7am.',
  },
  {
    id: H.pinehurst,
    name: 'Pinehurst Orthopedic Institute',
    address: '710 Sycamore Bend',
    city: 'Columbus',
    state: 'OH',
    zip: '43215',
    phone: '(614) 555-0166',
    notes: 'Highest volume account. Two dedicated ortho ORs plus a hybrid suite.',
  },
  {
    id: H.riverbend,
    name: 'Riverbend Community Hospital',
    address: '15 Mill Street',
    city: 'Toledo',
    state: 'OH',
    zip: '43604',
    phone: '(419) 555-0183',
    notes: 'Small account, single OR. Materials manager prefers email over phone.',
  },
  {
    id: H.crestview,
    name: 'Crestview Specialty Center',
    address: '9600 Orchard Point',
    city: 'Akron',
    state: 'OH',
    zip: '44312',
    phone: '(330) 555-0129',
    notes: '',
  },
];

const S = {
  arden: 'srg-arden',
  boyle: 'srg-boyle',
  chen: 'srg-chen',
  duval: 'srg-duval',
  ellsworth: 'srg-ellsworth',
  fontaine: 'srg-fontaine',
  gupta: 'srg-gupta',
  halloway: 'srg-halloway',
  imani: 'srg-imani',
  kovacs: 'srg-kovacs',
  larkin: 'srg-larkin',
  moreau: 'srg-moreau',
  nakashima: 'srg-nakashima',
  oyelaran: 'srg-oyelaran',
} as const;

const surgeons: Database['surgeons'] = [
  {
    id: S.arden,
    hospitalId: H.pinehurst,
    firstName: 'Ruth',
    lastName: 'Arden',
    specialty: 'Total joint reconstruction',
    phone: '(614) 555-0201',
    email: 'r.arden@pinehurstortho.example',
    notes: 'Runs two rooms on Tuesdays. Wants the rep in the room for the first case only.',
  },
  {
    id: S.boyle,
    hospitalId: H.pinehurst,
    firstName: 'Samuel',
    lastName: 'Boyle',
    specialty: 'Sports medicine',
    phone: '(614) 555-0208',
    email: 's.boyle@pinehurstortho.example',
    notes: '',
  },
  {
    id: S.chen,
    hospitalId: H.pinehurst,
    firstName: 'Wei',
    lastName: 'Chen',
    specialty: 'Spine',
    phone: '(614) 555-0214',
    email: 'w.chen@pinehurstortho.example',
    notes: 'Fellowship-trained in deformity. Very particular about screw inventory on site.',
  },
  {
    id: S.duval,
    hospitalId: H.stAgnes,
    firstName: 'Antoine',
    lastName: 'Duval',
    specialty: 'Trauma',
    phone: '(937) 555-0221',
    email: 'aduval@stagnesmed.example',
    notes: 'Takes most of the weekend trauma call. Text is the fastest way to reach him.',
  },
  {
    id: S.ellsworth,
    hospitalId: H.stAgnes,
    firstName: 'Margaret',
    lastName: 'Ellsworth',
    specialty: 'Hand and upper extremity',
    phone: '(937) 555-0233',
    email: 'mellsworth@stagnesmed.example',
    notes: '',
  },
  {
    id: S.fontaine,
    hospitalId: H.lakeshore,
    firstName: 'Gabriel',
    lastName: 'Fontaine',
    specialty: 'Total joint reconstruction',
    phone: '(216) 555-0244',
    email: 'g.fontaine@lakeshoreuh.example',
    notes: 'Department chair. Signs off on all new product trials at Lakeshore.',
  },
  {
    id: S.gupta,
    hospitalId: H.lakeshore,
    firstName: 'Anjali',
    lastName: 'Gupta',
    specialty: 'Spine',
    phone: '(216) 555-0251',
    email: 'a.gupta@lakeshoreuh.example',
    notes: '',
  },
  {
    id: S.halloway,
    hospitalId: H.lakeshore,
    firstName: 'Dennis',
    lastName: 'Halloway',
    specialty: 'Foot and ankle',
    phone: '(216) 555-0259',
    email: 'd.halloway@lakeshoreuh.example',
    notes: '',
  },
  {
    id: S.imani,
    hospitalId: H.mercyWest,
    firstName: 'Zainab',
    lastName: 'Imani',
    specialty: 'Sports medicine',
    phone: '(513) 555-0262',
    email: 'z.imani@mercywest.example',
    notes: 'Runs an efficient room — 6 scopes in a morning block is normal.',
  },
  {
    id: S.kovacs,
    hospitalId: H.mercyWest,
    firstName: 'Peter',
    lastName: 'Kovacs',
    specialty: 'Hand and upper extremity',
    phone: '(513) 555-0270',
    email: 'p.kovacs@mercywest.example',
    notes: '',
  },
  {
    id: S.larkin,
    hospitalId: H.riverbend,
    firstName: 'Nora',
    lastName: 'Larkin',
    specialty: 'General orthopedics',
    phone: '(419) 555-0288',
    email: 'nlarkin@riverbendch.example',
    notes: '',
  },
  {
    id: S.moreau,
    hospitalId: H.crestview,
    firstName: 'Étienne',
    lastName: 'Moreau',
    specialty: 'Total joint reconstruction',
    phone: '(330) 555-0294',
    email: 'e.moreau@crestviewsc.example',
    notes: '',
  },
  {
    id: S.nakashima,
    hospitalId: H.crestview,
    firstName: 'Yuki',
    lastName: 'Nakashima',
    specialty: 'Spine',
    phone: '(330) 555-0301',
    email: 'y.nakashima@crestviewsc.example',
    notes: 'New to the account as of this spring — no preference history yet.',
  },
  {
    id: S.oyelaran,
    hospitalId: H.stAgnes,
    firstName: 'Folake',
    lastName: 'Oyelaran',
    specialty: 'Trauma',
    phone: '(937) 555-0312',
    email: 'foyelaran@stagnesmed.example',
    notes: '',
  },
];

// ---------------------------------------------------------------------------
// Preference cards + revision log
// ---------------------------------------------------------------------------

type CardSeed = {
  id: string;
  surgeonId: string;
  topic: string;
  body: string;
  createdBy: string;
  createdAgo: number;
  /** Each entry is one edit, applied in order. */
  edits?: { by: string; agoMs: number; topic?: string; body?: string }[];
};

const cardSeeds: CardSeed[] = [
  {
    id: 'pc-arden-gloves',
    surgeonId: S.arden,
    topic: 'Glove size and preference',
    body: '7.5 Biogel PI Indicator, double glove. Keeps a spare pair opened on the back table.',
    createdBy: USERS.marcus,
    createdAgo: 210 * DAY,
    edits: [
      {
        by: USERS.priya,
        agoMs: 41 * DAY,
        body: '7.5 Biogel PI Indicator, double glove. Switched from 8.0 in the spring — confirm before opening a case.\n\nKeeps a spare pair opened on the back table.',
      },
    ],
  },
  {
    id: 'pc-arden-tray',
    surgeonId: S.arden,
    topic: 'Preferred tray setup',
    body: 'Primary knee tray plus the revision augment set staged in the room, unopened. Does not want the revision tray opened unless she asks.\n\nBroach handle goes on the right side of the Mayo stand.',
    createdBy: USERS.marcus,
    createdAgo: 188 * DAY,
    edits: [
      {
        by: USERS.marcus,
        agoMs: 96 * DAY,
        body: 'Primary knee tray plus the revision augment set staged in the room, unopened. Does not want the revision tray opened unless she asks.\n\nBroach handle goes on the right side of the Mayo stand. Wants the trial inserts laid out smallest to largest, left to right.',
      },
      {
        by: USERS.elena,
        agoMs: 9 * DAY,
        topic: 'Preferred tray setup (knee)',
        body: 'Primary knee tray plus the revision augment set staged in the room, unopened. Does not want the revision tray opened unless she asks.\n\nBroach handle goes on the right side of the Mayo stand. Wants the trial inserts laid out smallest to largest, left to right.\n\nHip cases are different — see the separate hip tray card.',
      },
    ],
  },
  {
    id: 'pc-arden-comms',
    surgeonId: S.arden,
    topic: 'Communication style',
    body: 'Direct and brief. Do not call between 7am and 1pm — she is operating. Text with a clear question and she will reply within the hour.\n\nDoes not like being asked the same question twice; write it down the first time.',
    createdBy: USERS.priya,
    createdAgo: 150 * DAY,
  },
  {
    id: 'pc-arden-hip',
    surgeonId: S.arden,
    topic: 'Hip tray setup',
    body: 'Anterior approach. Wants the Hana table accessory kit confirmed with the OR the day before.\n\nCup sizes 48–56 on site as a minimum.',
    createdBy: USERS.elena,
    createdAgo: 8 * DAY,
  },
  {
    id: 'pc-chen-screws',
    surgeonId: S.chen,
    topic: 'Screw inventory expectations',
    body: 'Expects a full complement of 5.5 and 6.5 polyaxial screws, 30–55mm, two of each on the shelf before the case starts.\n\nIf anything is short, tell him at the scrub sink — not once the patient is draped.',
    createdBy: USERS.priya,
    createdAgo: 132 * DAY,
    edits: [
      {
        by: USERS.tom,
        agoMs: 21 * DAY,
        body: 'Expects a full complement of 5.5 and 6.5 polyaxial screws, 30–55mm, two of each on the shelf before the case starts. Add 60mm for deformity cases.\n\nIf anything is short, tell him at the scrub sink — not once the patient is draped.',
      },
    ],
  },
  {
    id: 'pc-chen-imaging',
    surgeonId: S.chen,
    topic: 'Navigation and imaging',
    body: 'Uses navigation on every deformity case. Reference array goes on the contralateral side. Wants the tech in the room 30 minutes early for the spin.',
    createdBy: USERS.priya,
    createdAgo: 110 * DAY,
  },
  {
    id: 'pc-chen-comms',
    surgeonId: S.chen,
    topic: 'Communication style',
    body: 'Email for anything non-urgent, and he does read it. Phone only for same-day issues.\n\nCopy his coordinator Bernadette on scheduling questions.',
    createdBy: USERS.marcus,
    createdAgo: 74 * DAY,
  },
  {
    id: 'pc-duval-trauma',
    surgeonId: S.duval,
    topic: 'Trauma call expectations',
    body: 'Will call the rep line directly at any hour. Wants a human, not voicemail.\n\nKeeps a personal stock of 3.5 locking plates in the St. Agnes trauma cart — check the cart before pulling from the consignment set.',
    createdBy: USERS.tom,
    createdAgo: 240 * DAY,
    edits: [
      {
        by: USERS.marcus,
        agoMs: 30 * DAY,
        body: 'Will call the rep line directly at any hour. Wants a human, not voicemail.\n\nKeeps a personal stock of 3.5 locking plates in the St. Agnes trauma cart — check the cart before pulling from the consignment set. Cart was moved to the 4 West alcove in August.',
      },
    ],
  },
  {
    id: 'pc-duval-gloves',
    surgeonId: S.duval,
    topic: 'Glove size and preference',
    body: '8.5 latex-free, single glove. Hates powder of any kind.',
    createdBy: USERS.tom,
    createdAgo: 200 * DAY,
  },
  {
    id: 'pc-ellsworth-loupes',
    surgeonId: S.ellsworth,
    topic: 'Loupes and lighting',
    body: '3.5x loupes, her own. Wants the overhead lights dimmed for the microsurgical portion — mention it to the circulator early so it is not a scramble.',
    createdBy: USERS.elena,
    createdAgo: 88 * DAY,
  },
  {
    id: 'pc-ellsworth-music',
    surgeonId: S.ellsworth,
    topic: 'Room preferences',
    body: 'Music on, low. Classical or nothing. Room temperature on the cool side.\n\nIntroduce yourself once at the start of the case and then stay quiet unless asked.',
    createdBy: USERS.elena,
    createdAgo: 60 * DAY,
  },
  {
    id: 'pc-fontaine-trials',
    surgeonId: S.fontaine,
    topic: 'New product trials',
    body: 'All Lakeshore trials route through him as chair. He wants a one-page summary and the published data, not a brochure.\n\nAllow six weeks for value-analysis review. Do not approach other Lakeshore surgeons about a new product before he has seen it.',
    createdBy: USERS.tom,
    createdAgo: 175 * DAY,
    edits: [
      {
        by: USERS.tom,
        agoMs: 52 * DAY,
        topic: 'New product trials (Lakeshore gatekeeper)',
      },
      {
        by: USERS.jordan,
        agoMs: 4 * DAY,
        body: 'All Lakeshore trials route through him as chair. He wants a one-page summary and the published data, not a brochure.\n\nAllow six weeks for value-analysis review. Do not approach other Lakeshore surgeons about a new product before he has seen it.\n\nAs of this quarter he also wants a cost-per-case comparison against the incumbent.',
      },
    ],
  },
  {
    id: 'pc-fontaine-residents',
    surgeonId: S.fontaine,
    topic: 'Residents in the room',
    body: 'Expect two residents and often a fellow. He will hand off the closure.\n\nHe is fine with the rep teaching the residents on the instrumentation — encourages it, actually — but not mid-step.',
    createdBy: USERS.jordan,
    createdAgo: 44 * DAY,
  },
  {
    id: 'pc-gupta-timing',
    surgeonId: S.gupta,
    topic: 'Scheduling and arrival',
    body: 'First case starts on time, every time. Be in the room 45 minutes prior.\n\nIf you are going to be late, call the OR desk, not her cell.',
    createdBy: USERS.jordan,
    createdAgo: 38 * DAY,
  },
  {
    id: 'pc-imani-efficiency',
    surgeonId: S.imani,
    topic: 'Block-day workflow',
    body: 'Six scopes in a morning block. She does not stop between cases, so stage everything for all six before the first incision.\n\nShaver blades: 4.2 and 5.5, three of each per block.',
    createdBy: USERS.marcus,
    createdAgo: 70 * DAY,
    edits: [
      {
        by: USERS.priya,
        agoMs: 16 * DAY,
        body: 'Six scopes in a morning block. She does not stop between cases, so stage everything for all six before the first incision.\n\nShaver blades: 4.2 and 5.5, three of each per block. She has started using the 3.5 for small joints — add two.',
      },
    ],
  },
  {
    id: 'pc-imani-comms',
    surgeonId: S.imani,
    topic: 'Communication style',
    body: 'Friendly but time-poor. Catch her in the hallway between blocks rather than scheduling a meeting she will move twice.',
    createdBy: USERS.marcus,
    createdAgo: 55 * DAY,
  },
  {
    id: 'pc-kovacs-tourniquet',
    surgeonId: S.kovacs,
    topic: 'Tourniquet and positioning',
    body: 'Forearm tourniquet, 250 mmHg. Hand table on the patient right regardless of side — he walks around.',
    createdBy: USERS.elena,
    createdAgo: 34 * DAY,
  },
  {
    id: 'pc-larkin-coverage',
    surgeonId: S.larkin,
    topic: 'Coverage expectations',
    body: 'Single OR, low volume. She is comfortable running cases without a rep present as long as the tray is confirmed the day before.\n\nCall the day before, every time. That call is the whole relationship.',
    createdBy: USERS.priya,
    createdAgo: 120 * DAY,
  },
  {
    id: 'pc-moreau-language',
    surgeonId: S.moreau,
    topic: 'Communication style',
    body: 'Prefers written French for anything detailed but is entirely comfortable in English in the room.\n\nVery formal — "Dr. Moreau" until he says otherwise.',
    createdBy: USERS.jordan,
    createdAgo: 26 * DAY,
  },
  {
    id: 'pc-oyelaran-call',
    surgeonId: S.oyelaran,
    topic: 'Trauma call expectations',
    body: 'Splits weekend call with Dr. Duval. Same trauma cart, same rules.\n\nShe will text a photo of the imaging and expect a tray recommendation back within ten minutes.',
    createdBy: USERS.tom,
    createdAgo: 18 * DAY,
  },
];

/**
 * Expands the seeds into cards plus their revision log, the way the database
 * trigger in requirements §7.4 would: one 'created' row, then one 'edited' row
 * per edit, each carrying the previous value alongside the new one (FR-PREF-9).
 */
function expandCards(): {
  cards: Database['preferenceCards'];
  revisions: Database['preferenceCardRevisions'];
} {
  const cards: Database['preferenceCards'] = [];
  const revisions: Database['preferenceCardRevisions'] = [];

  for (const seed of cardSeeds) {
    let topic = seed.topic;
    let body = seed.body;
    const createdAt = ago(seed.createdAgo);

    revisions.push({
      id: `${seed.id}-rev-1`,
      cardId: seed.id,
      revisionNo: 1,
      action: 'created',
      topic,
      body,
      prevTopic: null,
      prevBody: null,
      changedBy: seed.createdBy,
      changedAt: createdAt,
    });

    let updatedAt = createdAt;
    let updatedBy = seed.createdBy;
    let version = 1;

    for (const edit of seed.edits ?? []) {
      const prevTopic = topic;
      const prevBody = body;
      topic = edit.topic ?? topic;
      body = edit.body ?? body;
      version += 1;
      updatedAt = ago(edit.agoMs);
      updatedBy = edit.by;

      revisions.push({
        id: `${seed.id}-rev-${version}`,
        cardId: seed.id,
        revisionNo: version,
        action: 'edited',
        topic,
        body,
        prevTopic,
        prevBody,
        changedBy: edit.by,
        changedAt: updatedAt,
      });
    }

    cards.push({
      id: seed.id,
      surgeonId: seed.surgeonId,
      topic,
      body,
      version,
      createdBy: seed.createdBy,
      updatedBy,
      createdAt,
      updatedAt,
      isDeleted: false,
    });
  }

  return { cards, revisions };
}

const { cards: preferenceCards, revisions: preferenceCardRevisions } = expandCards();

// ---------------------------------------------------------------------------
// Announcements
// ---------------------------------------------------------------------------

const announcements: Database['announcements'] = [
  {
    id: 'ann-phi',
    title: 'Reminder: no patient information in this app, ever',
    body: 'This app holds business information about hospitals and surgeons. It must never contain patient information — no names, no dates of birth, no case details that identify a person.\n\nThat means: no patient names in calendar event titles, no case specifics in preference cards, and no scanned charts in the documents area.\n\nIf you see something that crosses the line, do not reply to the post — message Dana or Tom directly and it will be removed.',
    authorId: USERS.dana,
    isPinned: true,
    editedAt: null,
    createdAt: ago(26 * DAY),
  },
  {
    id: 'ann-app',
    title: 'The field app is live — start with your own accounts',
    body: 'Everyone should now be able to log in. Please spend fifteen minutes this week adding preferences for the surgeons you cover most.\n\nStart with the three things that cost us the most when a covering rep does not know them: glove size, tray setup, and how the surgeon wants to be contacted.\n\nIf a surgeon is missing from the directory, send the name and hospital to Tom and he will add them.',
    authorId: USERS.tom,
    isPinned: true,
    editedAt: ago(19 * DAY),
    createdAt: ago(22 * DAY),
  },
  {
    id: 'ann-q3',
    title: 'Q3 numbers and where we landed',
    body: 'We closed Q3 at 112% of plan. Pinehurst and Lakeshore carried it; Mercy West came in soft on sports medicine, which we expected after the block-schedule change in July.\n\nFull breakdown is in Documents → Sales → Quarterly Reviews.\n\nThanks for a strong quarter.',
    authorId: USERS.dana,
    isPinned: false,
    editedAt: null,
    createdAt: ago(3 * HOUR),
  },
  {
    id: 'ann-recall',
    title: 'Action required: 4.5mm locking screw lot recall',
    body: 'The vendor has issued a voluntary recall on 4.5mm locking screws, lots ending 41B and 41C.\n\nPull them from every consignment set you cover today and log what you pulled in the shared sheet. The recall notice and the affected-lot list are in Documents → Product Specs → Recalls.\n\nIf a hospital asks whether a case used an affected lot, route that question to Dana. Do not answer it yourself.',
    authorId: USERS.dana,
    isPinned: false,
    editedAt: null,
    createdAt: ago(2 * DAY),
  },
  {
    id: 'ann-credentialing',
    title: 'Lakeshore credentialing now takes 48 hours',
    body: 'Lakeshore has moved to Vendormate and the clearance is no longer same-day. Budget two business days.\n\nPractically: if you get a Thursday call for a Monday case, start the paperwork Thursday.',
    authorId: USERS.priya,
    isPinned: false,
    editedAt: null,
    createdAt: ago(6 * DAY),
  },
  {
    id: 'ann-welcome',
    title: 'Welcome Casey Lindqvist to the Akron territory',
    body: 'Casey joins us Monday covering Crestview and the southern half of Riverbend. She comes from six years in spine distribution.\n\nJordan is handling her ride-alongs for the first two weeks. If you cover anything adjacent to Akron, introduce yourself.',
    authorId: USERS.tom,
    isPinned: false,
    editedAt: null,
    createdAt: ago(9 * DAY),
  },
  {
    id: 'ann-trays',
    title: 'Tray turnaround at St. Agnes is back to normal',
    body: 'Sterile processing has caught up. Same-day turnaround is available again, so you no longer need the second tray staged for afternoon adds.',
    authorId: USERS.marcus,
    isPinned: false,
    editedAt: null,
    createdAt: ago(13 * DAY),
  },
  {
    id: 'ann-expenses',
    title: 'Expense submissions move to the 5th of the month',
    body: 'Finance has shifted the cutoff from the last day of the month to the 5th of the following month. Nothing else about the process changes.',
    authorId: USERS.dana,
    isPinned: false,
    editedAt: null,
    createdAt: ago(20 * DAY),
  },
];

// ---------------------------------------------------------------------------
// Documents
// ---------------------------------------------------------------------------

const F = {
  productSpecs: 'fld-product-specs',
  recalls: 'fld-recalls',
  knee: 'fld-knee',
  spine: 'fld-spine',
  sales: 'fld-sales',
  quarterly: 'fld-quarterly',
  pricing: 'fld-pricing',
  hospitalForms: 'fld-hospital-forms',
  credentialing: 'fld-credentialing',
  training: 'fld-training',
} as const;

const folders: Database['folders'] = [
  {
    id: F.productSpecs,
    parentId: null,
    name: 'Product Specs',
    path: '/Product Specs/',
    depth: 0,
    createdBy: USERS.tom,
    createdAt: ago(300 * DAY),
  },
  {
    id: F.recalls,
    parentId: F.productSpecs,
    name: 'Recalls',
    path: '/Product Specs/Recalls/',
    depth: 1,
    createdBy: USERS.dana,
    createdAt: ago(60 * DAY),
  },
  {
    id: F.knee,
    parentId: F.productSpecs,
    name: 'Knee Systems',
    path: '/Product Specs/Knee Systems/',
    depth: 1,
    createdBy: USERS.tom,
    createdAt: ago(280 * DAY),
  },
  {
    id: F.spine,
    parentId: F.productSpecs,
    name: 'Spine Systems',
    path: '/Product Specs/Spine Systems/',
    depth: 1,
    createdBy: USERS.tom,
    createdAt: ago(280 * DAY),
  },
  {
    id: F.sales,
    parentId: null,
    name: 'Sales',
    path: '/Sales/',
    depth: 0,
    createdBy: USERS.dana,
    createdAt: ago(295 * DAY),
  },
  {
    id: F.quarterly,
    parentId: F.sales,
    name: 'Quarterly Reviews',
    path: '/Sales/Quarterly Reviews/',
    depth: 1,
    createdBy: USERS.dana,
    createdAt: ago(290 * DAY),
  },
  {
    id: F.pricing,
    parentId: F.sales,
    name: 'Pricing Sheets',
    path: '/Sales/Pricing Sheets/',
    depth: 1,
    createdBy: USERS.dana,
    createdAt: ago(250 * DAY),
  },
  {
    id: F.hospitalForms,
    parentId: null,
    name: 'Hospital Forms',
    path: '/Hospital Forms/',
    depth: 0,
    createdBy: USERS.priya,
    createdAt: ago(190 * DAY),
  },
  {
    id: F.credentialing,
    parentId: F.hospitalForms,
    name: 'Credentialing',
    path: '/Hospital Forms/Credentialing/',
    depth: 1,
    createdBy: USERS.priya,
    createdAt: ago(185 * DAY),
  },
  {
    id: F.training,
    parentId: null,
    name: 'Training',
    path: '/Training/',
    depth: 0,
    createdBy: USERS.tom,
    createdAt: ago(140 * DAY),
  },
];

const documents: Database['documents'] = [
  {
    id: 'doc-onboarding',
    folderId: null,
    name: 'Field Rep Handbook 2026.pdf',
    storagePath: 'documents/field-rep-handbook-2026.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 4_812_000,
    uploadedBy: USERS.dana,
    createdAt: ago(150 * DAY),
  },
  {
    id: 'doc-recall-notice',
    folderId: F.recalls,
    name: 'Recall Notice — 4.5mm Locking Screw Lots 41B 41C.pdf',
    storagePath: 'documents/recall-45mm-locking-screw.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 812_400,
    uploadedBy: USERS.dana,
    createdAt: ago(2 * DAY),
  },
  {
    id: 'doc-recall-lots',
    folderId: F.recalls,
    name: 'Affected Lot List.pdf',
    storagePath: 'documents/affected-lot-list.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 246_100,
    uploadedBy: USERS.dana,
    createdAt: ago(2 * DAY),
  },
  {
    id: 'doc-knee-primary',
    folderId: F.knee,
    name: 'Primary Knee System — Surgical Technique.pdf',
    storagePath: 'documents/primary-knee-technique.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 18_400_000,
    uploadedBy: USERS.tom,
    createdAt: ago(240 * DAY),
  },
  {
    id: 'doc-knee-revision',
    folderId: F.knee,
    name: 'Revision Augment Set — Tray Map.jpg',
    storagePath: 'documents/revision-augment-tray-map.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 2_140_000,
    uploadedBy: USERS.marcus,
    createdAt: ago(45 * DAY),
  },
  {
    id: 'doc-knee-sizing',
    folderId: F.knee,
    name: 'Knee Sizing Quick Reference.png',
    storagePath: 'documents/knee-sizing-quick-ref.png',
    mimeType: 'image/png',
    sizeBytes: 684_000,
    uploadedBy: USERS.marcus,
    createdAt: ago(80 * DAY),
  },
  {
    id: 'doc-spine-polyaxial',
    folderId: F.spine,
    name: 'Polyaxial Screw System — Technique Guide.pdf',
    storagePath: 'documents/polyaxial-screw-technique.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 22_900_000,
    uploadedBy: USERS.tom,
    createdAt: ago(230 * DAY),
  },
  {
    id: 'doc-spine-nav',
    folderId: F.spine,
    name: 'Navigation Array Setup.jpg',
    storagePath: 'documents/navigation-array-setup.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 3_220_000,
    uploadedBy: USERS.priya,
    createdAt: ago(100 * DAY),
  },
  {
    id: 'doc-q3',
    folderId: F.quarterly,
    name: 'Q3 2026 Business Review.pdf',
    storagePath: 'documents/q3-2026-review.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 6_410_000,
    uploadedBy: USERS.dana,
    createdAt: ago(3 * HOUR),
  },
  {
    id: 'doc-q2',
    folderId: F.quarterly,
    name: 'Q2 2026 Business Review.pdf',
    storagePath: 'documents/q2-2026-review.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 5_980_000,
    uploadedBy: USERS.dana,
    createdAt: ago(95 * DAY),
  },
  {
    id: 'doc-pricing-2026',
    folderId: F.pricing,
    name: '2026 Contract Pricing — All Accounts.pdf',
    storagePath: 'documents/2026-contract-pricing.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 1_240_000,
    uploadedBy: USERS.dana,
    createdAt: ago(210 * DAY),
  },
  {
    id: 'doc-cred-lakeshore',
    folderId: F.credentialing,
    name: 'Lakeshore Vendormate Walkthrough.pdf',
    storagePath: 'documents/lakeshore-vendormate.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 920_000,
    uploadedBy: USERS.priya,
    createdAt: ago(6 * DAY),
  },
  {
    id: 'doc-cred-stagnes',
    folderId: F.credentialing,
    name: 'St. Agnes Vendor Badge Application.pdf',
    storagePath: 'documents/st-agnes-badge-application.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 388_000,
    uploadedBy: USERS.priya,
    createdAt: ago(170 * DAY),
  },
  {
    id: 'doc-training-loaner',
    folderId: F.training,
    name: 'Loaner Set Return Process.pdf',
    storagePath: 'documents/loaner-set-return.pdf',
    mimeType: 'application/pdf',
    sizeBytes: 512_000,
    uploadedBy: USERS.tom,
    createdAt: ago(130 * DAY),
  },
  {
    id: 'doc-training-sterile',
    folderId: F.training,
    name: 'Sterile Field Etiquette — Photo Guide.heic',
    storagePath: 'documents/sterile-field-etiquette.heic',
    mimeType: 'image/heic',
    sizeBytes: 4_100_000,
    uploadedBy: USERS.elena,
    createdAt: ago(28 * DAY),
  },
];

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

const C = {
  red: 'cat-red',
  green: 'cat-green',
  blue: 'cat-blue',
  retired: 'cat-retired',
} as const;

const eventCategories: Database['eventCategories'] = [
  { id: C.red, name: 'Red', colorHex: '#D92D20', sortOrder: 1, isActive: true },
  { id: C.green, name: 'Green', colorHex: '#12855F', sortOrder: 2, isActive: true },
  { id: C.blue, name: 'Blue', colorHex: '#2563EB', sortOrder: 3, isActive: true },
  { id: C.retired, name: 'Training (retired)', colorHex: '#6938EF', sortOrder: 4, isActive: false },
];

const events: Database['events'] = [
  {
    id: 'evt-natl-sales',
    title: 'National sales meeting',
    description:
      'Three days in Columbus. Day one is product, day two is territory planning, day three is the vendor fair.\n\nTravel is booked centrally — see Documents → Training for the agenda.',
    categoryId: C.blue,
    startsAt: thisMonth(Math.min(today + 5, 26), 8, 0),
    endsAt: thisMonth(Math.min(today + 7, 28), 17, 0),
    isAllDay: true,
    location: 'Hyatt Regency, Columbus OH',
    hospitalId: null,
    surgeonId: null,
    createdBy: USERS.dana,
    createdAt: ago(40 * DAY),
  },
  {
    id: 'evt-arden-block',
    title: 'Dr. Arden block day — coverage needed',
    description: 'Two rooms. Marcus takes room 4, needs a second rep for room 6 after 10am.',
    categoryId: C.red,
    startsAt: thisMonth(Math.max(today - 1, 1), 7, 0),
    endsAt: thisMonth(Math.max(today - 1, 1), 15, 0),
    isAllDay: false,
    location: 'Pinehurst Orthopedic Institute, OR 4 & 6',
    hospitalId: H.pinehurst,
    surgeonId: S.arden,
    createdBy: USERS.tom,
    createdAt: ago(20 * DAY),
  },
  {
    id: 'evt-chen-deformity',
    title: 'Dr. Chen deformity case — nav tech on site',
    description: 'Long case. Confirm 60mm screws are on the shelf the day before.',
    categoryId: C.red,
    startsAt: thisMonth(today, 7, 30),
    endsAt: thisMonth(today, 16, 0),
    isAllDay: false,
    location: 'Pinehurst Orthopedic Institute, Hybrid Suite',
    hospitalId: H.pinehurst,
    surgeonId: S.chen,
    createdBy: USERS.tom,
    createdAt: ago(11 * DAY),
  },
  {
    id: 'evt-imani-block',
    title: 'Dr. Imani scope block',
    description: 'Six cases. Stage everything before the first incision.',
    categoryId: C.red,
    startsAt: thisMonth(today, 6, 45),
    endsAt: thisMonth(today, 12, 0),
    isAllDay: false,
    location: 'Mercy West Surgical Pavilion, OR 2',
    hospitalId: H.mercyWest,
    surgeonId: S.imani,
    createdBy: USERS.tom,
    createdAt: ago(8 * DAY),
  },
  {
    id: 'evt-vac-lakeshore',
    title: 'Lakeshore value analysis committee',
    description:
      'Dr. Fontaine is presenting the knee system. Priya attends; bring the cost-per-case comparison.',
    categoryId: C.green,
    startsAt: thisMonth(Math.min(today + 2, 27), 12, 0),
    endsAt: thisMonth(Math.min(today + 2, 27), 13, 30),
    isAllDay: false,
    location: 'Lakeshore University Hospital, Board Room B',
    hospitalId: H.lakeshore,
    surgeonId: S.fontaine,
    createdBy: USERS.dana,
    createdAt: ago(15 * DAY),
  },
  {
    id: 'evt-inventory',
    title: 'Consignment inventory count — St. Agnes',
    description: 'Quarterly count. Recall lots must be pulled and logged before the count starts.',
    categoryId: C.green,
    startsAt: thisMonth(Math.min(today + 1, 27), 16, 0),
    endsAt: thisMonth(Math.min(today + 1, 27), 18, 0),
    isAllDay: false,
    location: 'St. Agnes Regional Medical Center, SPD',
    hospitalId: H.stAgnes,
    surgeonId: null,
    createdBy: USERS.tom,
    createdAt: ago(25 * DAY),
  },
  {
    id: 'evt-casey-ride',
    title: 'Casey ride-along — Crestview',
    description: 'Jordan and Casey. Introduce her to Dr. Moreau and Dr. Nakashima.',
    categoryId: C.blue,
    startsAt: thisMonth(Math.min(today + 3, 27), 9, 0),
    endsAt: thisMonth(Math.min(today + 3, 27), 15, 0),
    isAllDay: false,
    location: 'Crestview Specialty Center',
    hospitalId: H.crestview,
    surgeonId: null,
    createdBy: USERS.tom,
    createdAt: ago(7 * DAY),
  },
  {
    id: 'evt-spine-inservice',
    title: 'Spine system in-service — Lakeshore residents',
    description: 'Dr. Gupta arranged the room. 45 minutes, hands-on with the sawbones.',
    categoryId: C.blue,
    startsAt: thisMonth(Math.min(today + 4, 27), 17, 0),
    endsAt: thisMonth(Math.min(today + 4, 27), 18, 0),
    isAllDay: false,
    location: 'Lakeshore University Hospital, Skills Lab',
    hospitalId: H.lakeshore,
    surgeonId: S.gupta,
    createdBy: USERS.dana,
    createdAt: ago(12 * DAY),
  },
  {
    id: 'evt-expense-cutoff',
    title: 'Expense submission cutoff',
    description: 'New cutoff is the 5th. Nothing else about the process changed.',
    categoryId: C.green,
    startsAt: thisMonth(5, 0, 0),
    endsAt: null,
    isAllDay: true,
    location: '',
    hospitalId: null,
    surgeonId: null,
    createdBy: USERS.dana,
    createdAt: ago(20 * DAY),
  },
  {
    id: 'evt-duval-trauma-call',
    title: 'Dr. Duval on trauma call',
    description: 'Weekend coverage. Tom is primary on the rep line.',
    categoryId: C.red,
    startsAt: thisMonth(Math.max(today - 4, 1), 7, 0),
    endsAt: thisMonth(Math.max(today - 2, 2), 7, 0),
    isAllDay: true,
    location: 'St. Agnes Regional Medical Center',
    hospitalId: H.stAgnes,
    surgeonId: S.duval,
    createdBy: USERS.tom,
    createdAt: ago(30 * DAY),
  },
  {
    id: 'evt-pricing-renewal',
    title: 'Pinehurst contract renewal call',
    description: 'Dana leads. Pricing sheet is in Documents → Sales → Pricing Sheets.',
    categoryId: C.green,
    startsAt: thisMonth(Math.max(today - 6, 1), 11, 0),
    endsAt: thisMonth(Math.max(today - 6, 1), 12, 0),
    isAllDay: false,
    location: 'Video call',
    hospitalId: H.pinehurst,
    surgeonId: null,
    createdBy: USERS.dana,
    createdAt: ago(35 * DAY),
  },
  {
    id: 'evt-ellsworth-case',
    title: 'Dr. Ellsworth hand case — new loupes vendor observing',
    description: '',
    categoryId: C.red,
    startsAt: thisMonth(Math.max(today - 9, 1), 8, 0),
    endsAt: thisMonth(Math.max(today - 9, 1), 11, 0),
    isAllDay: false,
    location: 'St. Agnes Regional Medical Center, OR 2',
    hospitalId: H.stAgnes,
    surgeonId: S.ellsworth,
    createdBy: USERS.tom,
    createdAt: ago(40 * DAY),
  },
  {
    id: 'evt-territory-review',
    title: 'Territory review — Akron handoff',
    description: 'Jordan hands the southern Riverbend accounts to Casey.',
    categoryId: C.blue,
    startsAt: thisMonth(Math.min(today + 9, 28), 13, 0),
    endsAt: thisMonth(Math.min(today + 9, 28), 14, 30),
    isAllDay: false,
    location: 'Video call',
    hospitalId: null,
    surgeonId: null,
    createdBy: USERS.dana,
    createdAt: ago(5 * DAY),
  },
  {
    id: 'evt-sterile-training',
    title: 'Sterile field refresher (annual)',
    description: 'Required for every rep with OR access. One hour, recorded.',
    categoryId: C.retired,
    startsAt: thisMonth(Math.max(today - 12, 1), 15, 0),
    endsAt: thisMonth(Math.max(today - 12, 1), 16, 0),
    isAllDay: false,
    location: 'Video call',
    hospitalId: null,
    surgeonId: null,
    createdBy: USERS.dana,
    createdAt: ago(60 * DAY),
  },
];

export const seed: Database = {
  users,
  hospitals,
  surgeons,
  preferenceCards,
  preferenceCardRevisions,
  announcements,
  folders,
  documents,
  eventCategories,
  events,
};

/** The account the prototype signs in as. Dana is an admin; see the role switch. */
export const DEFAULT_USER_ID = USERS.dana;
export const CATEGORY_IDS = C;
export const HOSPITAL_IDS = H;
export const SURGEON_IDS = S;
