import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TYPE_SCALE = Math.min(Math.max(SCREEN_WIDTH / 390, 0.9), 1.08);
const UI_SCALE = 1.06;

export const rs = (value: number) => Math.round(value * TYPE_SCALE * UI_SCALE);

export const REVIEW_COLORS = {
  background: '#F7F4F0',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F4F7',
  textPrimary: '#1A1C20',
  textSecondary: '#7B7F86',
  accent: '#0B8F98',
  accentSoft: '#DDF2F4',
  accentWarm: '#FDE7C6',
  border: '#E3E1DD',
  chip: '#E7EBEF',
  chipActive: '#0B8F98',
  chipText: '#1B1E23',
  chipTextActive: '#FFFFFF',
  star: '#F4B400',
  starMuted: '#D1D5DB',
  tabMuted: '#9AA0A6',
  divider: '#E5E3DE',
  buttonText: '#FFFFFF',
  success: '#1F7A57',
  error: '#D54545',
} as const;

export const REVIEW_FONTS = {
  heading: 'Avenir Next',
  body: 'SF Pro Rounded',
} as const;
