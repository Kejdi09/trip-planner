import type { FilterGroup, FilterOption } from '@/components/ui/types';

export const buildCountryFilterGroups = (
  options: readonly FilterOption[],
): FilterGroup[] => [
  {
    id: 'country',
    title: 'Filter by Country',
    options,
    layout: 'wrap',
  },
];

