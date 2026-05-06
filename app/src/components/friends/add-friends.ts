// ---------------------------------------------------------------------------
// Dummy data
// ---------------------------------------------------------------------------

export type FriendRequest = {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatarUrl: string | null;
};

export type UserSearchResult = {
  id: string;
  fullName: string;
  username: string;
  avatarUrl: string | null;
  requestSent: boolean;
};

const DUMMY_FRIEND_REQUESTS: FriendRequest[] = [
  {
    id: 'req-1',
    senderId: 'user-2',
    senderName: 'Kejdi Muci',
    senderUsername: 'kejdim',
    senderAvatarUrl: null,
  },
  {
    id: 'req-2',
    senderId: 'user-3',
    senderName: 'Eden Pajo',
    senderUsername: 'eden',
    senderAvatarUrl: null,
  },
];

const DUMMY_USER_POOL: UserSearchResult[] = [
  {
    id: 'user-4',
    fullName: 'Sabrina Alushi',
    username: 'sabc',
    avatarUrl: 'https://images.unsplash.com/photo-1490750967868-88df5691cc72?auto=format&fit=crop&w=200&q=80',
    requestSent: false,
  },
  {
    id: 'user-5',
    fullName: 'Sara Bektashi',
    username: 'sarabek',
    avatarUrl: null,
    requestSent: false,
  },
  {
    id: 'user-6',
    fullName: 'Andi Marku',
    username: 'andimark',
    avatarUrl: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=200&q=80',
    requestSent: false,
  },
  {
    id: 'user-7',
    fullName: 'Lena Duka',
    username: 'lenaduka',
    avatarUrl: null,
    requestSent: false,
  },
  {
    id: 'user-8',
    fullName: 'Blendi Hoxha',
    username: 'blendih',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    requestSent: false,
  },
];

// ---------------------------------------------------------------------------
// In-memory state (persists for the lifetime of the JS session)
// ---------------------------------------------------------------------------

let _pendingRequests: FriendRequest[] = [...DUMMY_FRIEND_REQUESTS];
let _userPool: UserSearchResult[] = [...DUMMY_USER_POOL];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/**
 * Returns all pending incoming friend requests for the current user.
 */
export async function fetchIncomingFriendRequests(): Promise<FriendRequest[]> {
  await delay(600);
  return [..._pendingRequests];
}

/**
 * Searches the user pool by name or username (case-insensitive).
 */
export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  await delay(400);

  const term = query.trim().toLowerCase();

  if (!term) {
    return [];
  }

  return _userPool
    .filter(
      (u) =>
        u.fullName.toLowerCase().includes(term) ||
        u.username.toLowerCase().includes(term),
    )
    .map((u) => ({ ...u })); // return copies so mutations don't leak
}

/**
 * Sends a friend request to the given user.
 * Marks the user as `requestSent: true` in the pool so subsequent searches reflect it.
 */
export async function sendFriendRequest(receiverId: string): Promise<void> {
  await delay(500);

  _userPool = _userPool.map((u) =>
    u.id === receiverId ? { ...u, requestSent: true } : u,
  );
}

/**
 * Accepts an incoming friend request and removes it from the pending list.
 */
export async function acceptFriendRequest(
  requestId: string,
  _senderId: string,
): Promise<void> {
  await delay(500);

  _pendingRequests = _pendingRequests.filter((r) => r.id !== requestId);
}

/**
 * Declines an incoming friend request and removes it from the pending list.
 */
export async function declineFriendRequest(requestId: string): Promise<void> {
  await delay(400);

  _pendingRequests = _pendingRequests.filter((r) => r.id !== requestId);
}