/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
    danger: '#C4351B',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
    danger: '#FF6B4A',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const MaxContentWidth = 800;

// Paleta categórica para gráficos (ej. gasto por categoría): un color fijo
// por posición, independiente de tema claro/oscuro, elegidos para que se
// distingan bien entre sí y se lean bien sobre fondos claros y oscuros.
export const ChartColors = [
  '#3C87F7',
  '#F79B3C',
  '#2FB380',
  '#E3477E',
  '#8B6CF0',
  '#E0B843',
  '#3CB8C4',
  '#C4573C',
  '#7A8794',
] as const;
