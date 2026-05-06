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