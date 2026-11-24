export const COLORS = {
  emerald: '#08765C',
  dark: '#142B27',
  bgLight: '#F4F7F6',
  bgDark: '#0E1F1B',
  cardLight: '#FFFFFF',
  cardDark: '#1A332C',
  textLight: '#142B27',
  textDark: '#E8F2EF',
  mutedLight: '#51645F',
  mutedDark: '#9DB8B0',
  red: '#DC2626',
  amber: '#D97706',
  borderLight: '#DCE6E2',
  borderDark: '#2A4A41',
} as const;

export interface Theme {
  bg: string;
  card: string;
  text: string;
  muted: string;
  border: string;
  primary: string;
}

export function getTheme(dark: boolean): Theme {
  return dark
    ? { bg: COLORS.bgDark, card: COLORS.cardDark, text: COLORS.textDark, muted: COLORS.mutedDark, border: COLORS.borderDark, primary: COLORS.emerald }
    : { bg: COLORS.bgLight, card: COLORS.cardLight, text: COLORS.textLight, muted: COLORS.mutedLight, border: COLORS.borderLight, primary: COLORS.emerald };
}

export function riskColor(level: number, insufficient: boolean): string {
  if (insufficient) return '#6B7280';
  if (level === 2) return COLORS.red;
  if (level === 1) return COLORS.amber;
  return COLORS.emerald;
}
