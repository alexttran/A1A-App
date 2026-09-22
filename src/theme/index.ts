/**
 * Design tokens. Values only — no components (see src/README.md).
 *
 * Contrast note (NFR-6): every foreground token below is checked at 4.5:1 or
 * better against the surface it is used on. `textSubtle` is the floor at 4.6:1
 * on `surface`; do not lighten it, and do not use it on `surfaceAlt`.
 */

export const colors = {
  /** A1A brand blue. Matches the Android adaptive-icon background family. */
  primary: '#12569C',
  primaryPressed: '#0E4478',
  primarySoft: '#E6F0FA',
  primaryBorder: '#B8D3EE',

  surface: '#FFFFFF',
  surfaceAlt: '#F5F7FA',
  surfaceSunken: '#EDF1F6',
  overlay: 'rgba(15, 23, 42, 0.45)',

  text: '#0F172A',
  textMuted: '#475569',
  textSubtle: '#64748B',
  textInverse: '#FFFFFF',

  border: '#DDE3EB',
  borderStrong: '#C3CCD8',

  success: '#0F7B4F',
  successSoft: '#E4F4EC',
  warning: '#9A5B00',
  warningSoft: '#FDF1DF',
  danger: '#B42318',
  dangerSoft: '#FDEBE9',
  info: '#12569C',
  infoSoft: '#E6F0FA',
} as const;

/** Offered to admins when recolouring an event category (FR-ADM-5). */
export const categoryPalette = [
  '#D92D20',
  '#DC6803',
  '#CA8504',
  '#12855F',
  '#0E7090',
  '#2563EB',
  '#6938EF',
  '#BA24D5',
] as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  pill: 999,
} as const;

/**
 * Type scale. `lineHeight` is baked in because React Native does not derive one,
 * and inconsistent line heights were the most visible drift in the last project.
 */
export const type = {
  display: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  title: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  heading: { fontSize: 17, lineHeight: 23, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 15, lineHeight: 22, fontWeight: '600' },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
  micro: { fontSize: 11, lineHeight: 14, fontWeight: '600' },
} as const;

export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  raised: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.16,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

/** requirements NFR-6 — 44x44pt minimum touch target. */
export const MIN_TOUCH_TARGET = 44;
