import { Dimensions } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TYPE_SCALE = Math.min(Math.max(SCREEN_WIDTH / 390, 0.9), 1.08);

/** Responsive size helper — mirrors the pattern used in groups/friends */
export const rs = (v: number) => Math.round(v * TYPE_SCALE);

export const C = {
  bg: '#FFFFFF',
  primary: '#008D9B',
  primaryLight: '#D7EDF0',
  text: '#111318',
  muted: '#8F949F',
  sectionLabel: '#8F949F',
  border: '#EBEBEB',
  cardBg: '#FFFFFF',
  cardBorder: '#E0E4E8',
  pillBg: '#F0F4F7',

  // Stat tile accent colours (matching the screenshots)
  statCountriesBg: '#EAF6F7',
  statCitiesBg: '#EAF6F7',
  statRatedBg: '#FCE8F0',
  statGroupsBg: '#EEE8FC',

  statCountriesIcon: '#008D9B',
  statCitiesIcon: '#008D9B',
  statRatedIcon: '#D6226E',
  statGroupsIcon: '#7C3AED',

  // Timeline dot colours
  dot1: '#008D9B',
  dot2: '#008D9B',
  dot3: '#D6226E',

  mapBorder: '#008D9B',
  upcoming: '#2563EB',
  completed: '#6B7280',
} as const;
