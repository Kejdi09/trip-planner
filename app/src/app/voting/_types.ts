// ─── Shared Types ────────────────────────────────────────────────────────────

export interface Member {
  id: string;
  initials: string;
  avatarColor: string;
}

export interface DestinationOption {
  id: string;
  city: string;
  country: string;
  image: string;
  votedCount: number;
  totalMembers: number;
  voters: Member[];
  selected: boolean;
}

export interface DateOption {
  id: string;
  label: string;
  startDate: Date;
  endDate: Date;
  votedCount: number;
  totalMembers: number;
  voters: Member[];
  selected: boolean;
}

export interface BudgetOption {
  id: string;
  label: string;
  min: number;
  max: number;
  votedCount: number;
  totalMembers: number;
  voters: Member[];
  selected: boolean;
}

export type VotingTab = 'Dates' | 'Budget';

// ─── Mock Data ────────────────────────────────────────────────────────────────

export const MEMBERS: Member[] = [
  { id: '1', initials: 'A', avatarColor: '#2DD4BF' },
  { id: '2', initials: 'K', avatarColor: '#94A3B8' },
  { id: '3', initials: 'M', avatarColor: '#94A3B8' },
  { id: '4', initials: 'L', avatarColor: '#94A3B8' },
  { id: '5', initials: 'R', avatarColor: '#94A3B8' },
];

export const MOCK_DESTINATIONS: DestinationOption[] = [
  {
    id: 'd1',
    city: 'Barcelona',
    country: 'Spain',
    image: 'https://images.unsplash.com/photo-1583422409516-2895a77efded?w=120&h=90&fit=crop',
    votedCount: 4,
    totalMembers: 5,
    voters: MEMBERS.slice(0, 4),
    selected: true,
  },
  {
    id: 'd2',
    city: 'Amsterdam',
    country: 'Netherlands',
    image: 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017?w=120&h=90&fit=crop',
    votedCount: 1,
    totalMembers: 5,
    voters: MEMBERS.slice(0, 1),
    selected: false,
  },
  {
    id: 'd3',
    city: 'Paris',
    country: 'France',
    image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=120&h=90&fit=crop',
    votedCount: 0,
    totalMembers: 5,
    voters: [],
    selected: false,
  },
];

export const MOCK_DATES: DateOption[] = [
  {
    id: 'dt1',
    label: 'June 12-20, 2026',
    startDate: new Date(2026, 5, 12),
    endDate: new Date(2026, 5, 20),
    votedCount: 4,
    totalMembers: 5,
    voters: MEMBERS.slice(0, 4),
    selected: true,
  },
  {
    id: 'dt2',
    label: 'June 1-5, 2026',
    startDate: new Date(2026, 5, 1),
    endDate: new Date(2026, 5, 5),
    votedCount: 1,
    totalMembers: 5,
    voters: MEMBERS.slice(0, 1),
    selected: false,
  },
];

export const MOCK_BUDGETS: BudgetOption[] = [
  {
    id: 'b1',
    label: '€700 – €1000',
    min: 700,
    max: 1000,
    votedCount: 2,
    totalMembers: 5,
    voters: MEMBERS.slice(0, 2),
    selected: true,
  },
  {
    id: 'b2',
    label: '€1000 – €1500',
    min: 1000,
    max: 1500,
    votedCount: 1,
    totalMembers: 5,
    voters: MEMBERS.slice(0, 1),
    selected: false,
  },
];

export const MOCK_CONFLICT_BUDGETS: BudgetOption[] = [
  {
    id: 'bc1',
    label: '€700 – €1000',
    min: 700,
    max: 1000,
    votedCount: 1,
    totalMembers: 5,
    voters: MEMBERS.slice(0, 1),
    selected: true,
  },
  {
    id: 'bc2',
    label: '€1000 – €1500',
    min: 1000,
    max: 1500,
    votedCount: 1,
    totalMembers: 5,
    voters: MEMBERS.slice(0, 1),
    selected: false,
  },
];
