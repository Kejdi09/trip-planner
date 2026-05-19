// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type Friend = {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  tripCount: number;
};

export type GroupMember = Friend & {
  role: 'admin' | 'member';
};

export type GroupStatus = 'active' | 'upcoming' | 'completed';

export type GroupPlace = {
  name: string;
};

export type Group = {
  id: string;
  name: string;
  adminId: string;
  members: GroupMember[];
  status: GroupStatus;
  votingOpen: boolean;
  places: GroupPlace[];
  dateRange: string | null;
  budgetRange: string | null;
  destination: string | null;
};

export type ChatMessage = {
  id: string;
  groupId: string;
  senderId: string;
  text: string;
  timestamp: string; // "HH:MM"
  dateLabel: string | null; // e.g. "Yesterday" — shown once per day group
};

// ---------------------------------------------------------------------------
// Friends
// ---------------------------------------------------------------------------

export const DUMMY_FRIENDS: Friend[] = [
  {
    id: 'user-1',
    fullName: 'Olta Deda',
    username: 'oltad',
    avatarUrl:
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
    tripCount: 5,
  },
  {
    id: 'user-2',
    fullName: 'Markli Tati',
    username: 'markli',
    avatarUrl:
      'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80',
    tripCount: 5,
  },
  {
    id: 'user-3',
    fullName: 'Sabrina Alushi',
    username: 'sabc',
    avatarUrl:
      'https://images.unsplash.com/photo-1490750967868-88df5691cc72?auto=format&fit=crop&w=200&q=80',
    tripCount: 5,
  },
  {
    id: 'user-4',
    fullName: 'Kejdi Muci',
    username: 'klmuci',
    avatarUrl: null,
    tripCount: 3,
  },
  {
    id: 'user-5',
    fullName: 'Eden Pajo',
    username: 'eden',
    avatarUrl: null,
    tripCount: 2,
  },
];

// The "current user" for the session
export const CURRENT_USER: Friend = {
  id: 'me',
  fullName: 'You',
  username: 'me',
  avatarUrl: null,
  tripCount: 8,
};

// ---------------------------------------------------------------------------
// Groups (mutable in-memory)
// ---------------------------------------------------------------------------

export let DUMMY_GROUPS: Group[] = [
  {
    id: 'group-1',
    name: 'Summer Europe Trip',
    adminId: 'user-1',
    members: [
      { ...DUMMY_FRIENDS[0], role: 'admin' },
      { ...DUMMY_FRIENDS[1], role: 'member' },
      { ...DUMMY_FRIENDS[2], role: 'member' },
      { ...CURRENT_USER, role: 'member' },
    ],
    status: 'active',
    votingOpen: true,
    places: [{ name: 'Barcelona' }, { name: 'Paris' }, { name: 'Rome' }],
    dateRange: 'Jun 15-25',
    budgetRange: '$2-3k',
    destination: 'Barcelona, Spain',
  },
  {
    id: 'group-2',
    name: 'Family Reunion',
    adminId: 'me',
    members: [
      { ...CURRENT_USER, role: 'admin' },
      { ...DUMMY_FRIENDS[3], role: 'member' },
      { ...DUMMY_FRIENDS[4], role: 'member' },
    ],
    status: 'upcoming',
    votingOpen: false,
    places: [],
    dateRange: 'Aug 10-14',
    budgetRange: null,
    destination: null,
  },
  {
    id: 'group-3',
    name: 'College Friend',
    adminId: 'user-2',
    members: [
      { ...DUMMY_FRIENDS[1], role: 'admin' },
      { ...CURRENT_USER, role: 'member' },
    ],
    status: 'completed',
    votingOpen: false,
    places: [],
    dateRange: 'Mar 3-7',
    budgetRange: '$1-2k',
    destination: 'Athens, Greece',
  },
];

// ---------------------------------------------------------------------------
// Chat messages (mutable in-memory)
// ---------------------------------------------------------------------------

export let DUMMY_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-1',
    groupId: 'group-1',
    senderId: 'me',
    text: 'Hi',
    timestamp: '19:01',
    dateLabel: 'Yesterday',
  },
  {
    id: 'msg-2',
    groupId: 'group-1',
    senderId: 'user-1',
    text: 'Hello',
    timestamp: '19:30',
    dateLabel: null,
  },
];

// ---------------------------------------------------------------------------
// Mutation helpers
// ---------------------------------------------------------------------------

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

let _nextGroupId = 10;
let _nextMsgId = 100;

export async function createGroup(name: string): Promise<Group> {
  await delay(500);
  const newGroup: Group = {
    id: `group-${_nextGroupId++}`,
    name,
    adminId: 'me',
    members: [{ ...CURRENT_USER, role: 'admin' }],
    status: 'upcoming',
    votingOpen: false,
    places: [],
    dateRange: null,
    budgetRange: null,
    destination: null,
  };
  DUMMY_GROUPS = [newGroup, ...DUMMY_GROUPS];
  return newGroup;
}

export async function inviteFriendToGroup(
  groupId: string,
  friendId: string,
): Promise<void> {
  await delay(400);
  const friend = DUMMY_FRIENDS.find((f) => f.id === friendId);
  if (!friend) return;
  DUMMY_GROUPS = DUMMY_GROUPS.map((g) => {
    if (g.id !== groupId) return g;
    const alreadyIn = g.members.some((m) => m.id === friendId);
    if (alreadyIn) return g;
    return { ...g, members: [...g.members, { ...friend, role: 'member' }] };
  });
}

export async function sendMessage(
  groupId: string,
  text: string,
): Promise<ChatMessage> {
  await delay(200);
  const now = new Date();
  const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const msg: ChatMessage = {
    id: `msg-${_nextMsgId++}`,
    groupId,
    senderId: 'me',
    text,
    timestamp,
    dateLabel: null,
  };
  DUMMY_MESSAGES = [...DUMMY_MESSAGES, msg];
  return msg;
}

export async function removeFriend(friendId: string): Promise<void> {
  await delay(400);
  // In a real app this would update a DB; here we just simulate success
}

export async function fetchGroups(): Promise<Group[]> {
  await delay(500);
  return [...DUMMY_GROUPS];
}

export async function fetchMessages(groupId: string): Promise<ChatMessage[]> {
  await delay(400);
  return DUMMY_MESSAGES.filter((m) => m.groupId === groupId);
}

export async function fetchFriends(): Promise<Friend[]> {
  await delay(500);
  return [...DUMMY_FRIENDS];
}

export async function fetchGroupById(groupId: string): Promise<Group | null> {
  await delay(300);
  return DUMMY_GROUPS.find((g) => g.id === groupId) ?? null;
}
// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TripMember = {
  id: string;
  avatarUrl: string | null;
};

export type Trip = {
  id: string;
  destination: string;   // e.g. "Tokyo, Japan"
  month: string;         // e.g. "March 2026"
  durationDays: number;
  members: TripMember[];
  images: string[];      // up to 3 photo URLs
  coordinates: {         // for map pins
    latitude: number;
    longitude: number;
  };
};

export type TravelStats = {
  countries: number;
  cities: number;
  placesRated: number;
  groupTrips: number;
};

// ---------------------------------------------------------------------------
// Seed data
// ---------------------------------------------------------------------------

const DUMMY_TRAVEL_STATS: TravelStats = {
  countries: 12,
  cities: 25,
  placesRated: 54,
  groupTrips: 8,
};

const DUMMY_TRIPS: Trip[] = [
  {
    id: 'trip-1',
    destination: 'Tokyo, Japan',
    month: 'March 2026',
    durationDays: 7,
    members: [
      { id: 'user-1', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80' },
      { id: 'user-2', avatarUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80' },
    ],
    images: [
      'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1522383225653-ed111181a951?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1513407030348-c983a97b98d8?auto=format&fit=crop&w=400&q=80',
    ],
    coordinates: { latitude: 35.6762, longitude: 139.6503 },
  },
  {
    id: 'trip-2',
    destination: 'Barcelona, Spain',
    month: 'September 2025',
    durationDays: 4,
    members: [
      { id: 'user-3', avatarUrl: 'https://images.unsplash.com/photo-1490750967868-88df5691cc72?auto=format&fit=crop&w=200&q=80' },
      { id: 'user-4', avatarUrl: null },
    ],
    images: [
      'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=400&q=80',
    ],
    coordinates: { latitude: 41.3851, longitude: 2.1734 },
  },
  {
    id: 'trip-3',
    destination: 'Bali, Indonesia',
    month: 'May 2025',
    durationDays: 8,
    members: [
      { id: 'user-5', avatarUrl: null },
      { id: 'user-1', avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80' },
    ],
    images: [
      'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1555400038-63f5ba517a47?auto=format&fit=crop&w=400&q=80',
    ],
    coordinates: { latitude: -8.3405, longitude: 115.0920 },
  },
  {
    id: 'trip-4',
    destination: 'Rome, Italy',
    month: 'January 2025',
    durationDays: 5,
    members: [
      { id: 'user-2', avatarUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=200&q=80' },
    ],
    images: [
      'https://images.unsplash.com/photo-1555992336-03a23c7b20ee?auto=format&fit=crop&w=400&q=80',
      'https://images.unsplash.com/photo-1529154036614-a60975f5c760?auto=format&fit=crop&w=400&q=80',
    ],
    coordinates: { latitude: 41.9028, longitude: 12.4964 },
  },
  {
    id: 'trip-5',
    destination: 'Kyoto, Japan',
    month: 'November 2024',
    durationDays: 6,
    members: [
      { id: 'user-3', avatarUrl: 'https://images.unsplash.com/photo-1490750967868-88df5691cc72?auto=format&fit=crop&w=200&q=80' },
      { id: 'user-4', avatarUrl: null },
    ],
    images: [
      'https://images.unsplash.com/photo-1492571350019-22de08371fd3?auto=format&fit=crop&w=400&q=80',
    ],
    coordinates: { latitude: 35.0116, longitude: 135.7681 },
  },
];

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/** Returns the current user's travel stats. */
export async function fetchTravelStats(): Promise<TravelStats> {
  await delay(400);
  return { ...DUMMY_TRAVEL_STATS };
}

/** Returns all trips, most recent first. */
export async function fetchAllTrips(): Promise<Trip[]> {
  await delay(500);
  return [...DUMMY_TRIPS];
}

/** Returns the first N trips for the history preview. */
export async function fetchRecentTrips(limit = 3): Promise<Trip[]> {
  await delay(500);
  return DUMMY_TRIPS.slice(0, limit);
}

/** Returns a single trip by ID, or null if not found. */
export async function fetchTripById(tripId: string): Promise<Trip | null> {
  await delay(300);
  return DUMMY_TRIPS.find((t) => t.id === tripId) ?? null;
}
