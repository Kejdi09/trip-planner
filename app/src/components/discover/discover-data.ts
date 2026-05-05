import type { FilterGroup, FilterOption } from '@/components/ui/types';

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

