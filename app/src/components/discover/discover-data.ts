import type { FilterOption, Place } from '@/components/discover/types';

export const FILTER_OPTIONS: readonly FilterOption[] = [
  { id: 'top_rated', label: 'Top rated' },
  { id: 'friends_visited', label: 'Friends visited' },
  { id: 'asia', label: 'Asia' },
  { id: 'europe', label: 'Europe' },
  { id: 'beach', label: 'Beach' },
  { id: 'city', label: 'City' },
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
