import type { FilterGroup, FilterOption, Place } from '@/components/ui/types';

const POPULARITY_FILTER_OPTIONS: readonly FilterOption[] = [
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

const TAG_FILTER_OPTIONS: readonly FilterOption[] = [
  { id: 'nature', label: 'Nature' },
  { id: 'adventure', label: 'Adventure' },
  { id: 'family', label: 'Family' },
  { id: 'culture', label: 'Culture' },
  { id: 'history', label: 'History' },
];

export const FILTER_OPTIONS: readonly FilterOption[] = [
  ...POPULARITY_FILTER_OPTIONS,
  ...TAG_FILTER_OPTIONS,
];

export const FILTER_GROUPS: readonly FilterGroup[] = [
  {
    id: 'popularity',
    title: 'Filter by Popularity',
    options: POPULARITY_FILTER_OPTIONS,
    layout: 'row',
  },
  {
    id: 'tags',
    title: 'Filter by Tags',
    options: TAG_FILTER_OPTIONS,
    layout: 'wrap',
  },
];

export const DUMMY_PLACES: readonly Place[] = [
  {
    id: '1',
    title: 'Kyoto, Japan',
    region: 'East Asia',
    visited: '12 friends visited',
    rating: 4.8,
    image:
      'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '2',
    title: 'Bali, Indonesia',
    region: 'Southeast Asia',
    visited: '9 friends visited',
    rating: 4.6,
    image:
      'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1200&q=80',
  },
  {
    id: '3',
    title: 'Florence, Italy',
    region: 'Southern Europe',
    visited: '7 friends visited',
    rating: 4.7,
    image:
      'https://images.unsplash.com/photo-1543429776-2782fcdfb569?auto=format&fit=crop&w=1200&q=80',
  },
];
