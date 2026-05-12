import { API_BASE_URL, APP_ENV } from './app-config';

const DEMO_USER_ID = '00000000-0000-4000-8000-000000000002';

const base = () => (API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL);

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${base()}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-app-env': APP_ENV,
      ...(init?.headers ?? {}),
    },
  });

  const rawBody = await response.text();
  const payload = rawBody
    ? ((() => {
        try {
          return JSON.parse(rawBody);
        } catch {
          return {};
        }
      })() as Record<string, unknown>)
    : {};

  if (!response.ok) {
    const errorValue = payload.error as unknown;
    const apiMessage =
      typeof errorValue === 'string'
        ? errorValue
        : typeof errorValue === 'object' && errorValue !== null && 'message' in errorValue && typeof (errorValue as { message?: unknown }).message === 'string'
          ? (errorValue as { message: string }).message
          : rawBody || 'Unknown error response';

    const message = `Groups API request failed (${response.status} ${response.statusText}) for ${path}: ${apiMessage}`;
    console.error(message, { url: `${base()}${path}`, status: response.status, body: rawBody });
    throw new Error(message);
  }

  return payload as T;
}

export function getActiveUserId() {
  return DEMO_USER_ID;
}

export type GroupRow = {
  id: string;
  name: string | null;
  description: string | null;
  created_by: string | null;
  status: 'planning' | 'active' | 'completed' | string;
  voting_deadline: string | null;
  destination_place_id: string | null;
  start_date: string | null;
  end_date: string | null;
  min_budget: number | null;
  max_budget: number | null;
  created_at: string | null;
};

export type GroupMemberRow = {
  id: string;
  group_id: string;
  user_id: string;
  joined_at: string | null;
};

export type GroupMessageRow = {
  id: string;
  group_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type ItineraryItemRow = {
  id: string;
  group_id: string;
  title: string;
  date: string;
  time: string | null;
  created_by: string;
  created_at: string;
};

export function fetchMyGroups(userId = DEMO_USER_ID) {
  const params = new URLSearchParams({ userId });
  return request<{ groups: GroupRow[] }>(`/api/groups?${params.toString()}`, { method: 'GET' });
}

export function createGroupApi(name: string, createdBy = DEMO_USER_ID, description?: string) {
  return request<GroupRow>('/api/groups', {
    method: 'POST',
    body: JSON.stringify({ name, createdBy, description: description ?? null }),
  });
}

export function fetchGroupMembers(groupId: string, userId = DEMO_USER_ID) {
  const params = new URLSearchParams({ userId });
  return request<{ members: GroupMemberRow[] }>(`/api/groups/${groupId}/members?${params.toString()}`, { method: 'GET' });
}

export function addGroupMember(groupId: string, newUserId: string, actorId = DEMO_USER_ID) {
  return request<GroupMemberRow>(`/api/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ actorId, userId: newUserId }),
  });
}

export function fetchGroupMessages(groupId: string, userId = DEMO_USER_ID, offset = 0, limit = 50) {
  const params = new URLSearchParams({ userId, offset: String(offset), limit: String(limit) });
  return request<{ messages: GroupMessageRow[] }>(`/api/groups/${groupId}/messages?${params.toString()}`, { method: 'GET' });
}

export function postGroupMessage(groupId: string, content: string, userId = DEMO_USER_ID) {
  return request<GroupMessageRow>(`/api/groups/${groupId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ userId, content }),
  });
}

export function fetchItinerary(groupId: string, userId = DEMO_USER_ID) {
  const params = new URLSearchParams({ userId });
  return request<{ items: ItineraryItemRow[] }>(`/api/groups/${groupId}/itinerary?${params.toString()}`, { method: 'GET' });
}

export function createItineraryItem(groupId: string, title: string, date: string, time?: string | null, userId = DEMO_USER_ID) {
  return request<ItineraryItemRow>(`/api/groups/${groupId}/itinerary`, {
    method: 'POST',
    body: JSON.stringify({ userId, title, date, time: time ?? null }),
  });
}

export function deleteItineraryItem(groupId: string, itemId: string, userId = DEMO_USER_ID) {
  const params = new URLSearchParams({ userId });
  return fetch(`${base()}/api/groups/${groupId}/itinerary/${itemId}?${params.toString()}`, {
    method: 'DELETE',
    headers: {
      'content-type': 'application/json',
      'x-app-env': APP_ENV,
    },
  }).then(async (response) => {
    if (response.status === 204) return;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error ?? 'Delete failed');
  });
}
