import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TYPE_SCALE = Math.min(Math.max(SCREEN_WIDTH / 390, 0.9), 1.08);
const UI_SCALE = 1.06;

export const rs = (value: number) => Math.round(value * TYPE_SCALE * UI_SCALE);

export const REVIEW_COLORS = {
  background: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceMuted: '#E3E8EC',
  textPrimary: '#000000',
  textSecondary: '#A19D9D',
  accent: '#008D9B',
  accentSoft: '#D7EDF0',
  accentWarm: '#FFF4CC',
  border: '#CFCFCF',
  chip: '#D3DAE0',
  chipActive: '#008D9B',
  chipText: '#091018',
  chipTextActive: '#FFFFFF',
  star: '#F4B400',
  starMuted: '#D1D5DB',
  tabMuted: '#A19D9D',
  divider: '#CCCCCC',
  buttonText: '#FFFFFF',
  success: '#008D9B',
  error: '#D54545',
} as const;
