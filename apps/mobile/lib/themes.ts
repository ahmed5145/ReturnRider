export type ThemeMode = 'dark' | 'light';

export interface ThemeColors {
  bg: string;
  bgCard: string;
  bgElevated: string;
  accent: string;
  accentSoft: string;
  text: string;
  textMuted: string;
  textDim: string;
  success: string;
  border: string;
}

export const darkTheme: ThemeColors = {
  bg: '#0f1419',
  bgCard: '#1a2332',
  bgElevated: '#243044',
  accent: '#e94560',
  accentSoft: 'rgba(233, 69, 96, 0.15)',
  text: '#ffffff',
  textMuted: '#9aa8bc',
  textDim: '#6b7a8f',
  success: '#3dd68c',
  border: '#2d3a4f',
};

export const lightTheme: ThemeColors = {
  bg: '#f4f6f9',
  bgCard: '#ffffff',
  bgElevated: '#e8ecf2',
  accent: '#d63854',
  accentSoft: 'rgba(214, 56, 84, 0.12)',
  text: '#0f1419',
  textMuted: '#4a5568',
  textDim: '#718096',
  success: '#2a9d63',
  border: '#d8dee8',
};

export function paletteForMode(mode: ThemeMode): ThemeColors {
  return mode === 'light' ? lightTheme : darkTheme;
}
