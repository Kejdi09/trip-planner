import { API_BASE_URL, APP_ENV } from './app-config';
import { supabase } from './supabase';

const base = () => (API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL);

let cachedUserId = '';
void supabase.auth.getSession().then(({ data }) => {
  cachedUserId = data.session?.user?.id ?? '';
});


async function resolveActiveUserId(userId?: string): Promise<string> {
  if (userId && userId.trim()) return userId.trim();

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) {
    throw new Error('No authenticated user session found. Please log in again.');
  }

  return data.user.id;
}

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
  return cachedUserId;
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
export type GroupMemberRow = { id: string; group_id: string; user_id: string; joined_at: string | null };
export type GroupMessageRow = { id: string; group_id: string; sender_id: string; content: string; created_at: string };
export type ItineraryItemRow = { id: string; group_id: string; title: string; date: string; time: string | null; created_by: string; created_at: string };

export async function fetchMyGroups(userId?: string) {
  const resolvedUserId = await resolveActiveUserId(userId);
  const params = new URLSearchParams({ userId: resolvedUserId });
  return request<{ groups: GroupRow[] }>(`/api/groups?${params.toString()}`, { method: 'GET' });
}

export async function createGroupApi(name: string, createdBy?: string, description?: string) {
  const resolvedUserId = await resolveActiveUserId(createdBy);
  return request<GroupRow>('/api/groups', {
    method: 'POST',
    body: JSON.stringify({ name, createdBy: resolvedUserId, description: description ?? null }),
  });
}

export async function fetchGroupMembers(groupId: string, userId?: string) {
  const resolvedUserId = await resolveActiveUserId(userId);
  const params = new URLSearchParams({ userId: resolvedUserId });
  return request<{ members: GroupMemberRow[] }>(`/api/groups/${groupId}/members?${params.toString()}`, { method: 'GET' });
}

export async function addGroupMember(groupId: string, newUserId: string, actorId?: string) {
  const resolvedActorId = await resolveActiveUserId(actorId);
  return request<GroupMemberRow>(`/api/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ actorId: resolvedActorId, userId: newUserId }),
  });
}

export async function fetchGroupMessages(groupId: string, userId?: string, offset = 0, limit = 50) {
  const resolvedUserId = await resolveActiveUserId(userId);
  const params = new URLSearchParams({ userId: resolvedUserId, offset: String(offset), limit: String(limit) });
  return request<{ messages: GroupMessageRow[] }>(`/api/groups/${groupId}/messages?${params.toString()}`, { method: 'GET' });
}

export async function postGroupMessage(groupId: string, content: string, userId?: string) {
  const resolvedUserId = await resolveActiveUserId(userId);
  return request<GroupMessageRow>(`/api/groups/${groupId}/messages`, {
    method: 'POST',
    body: JSON.stringify({ userId: resolvedUserId, content }),
  });
}

export async function fetchItinerary(groupId: string, userId?: string) {
  const resolvedUserId = await resolveActiveUserId(userId);
  const params = new URLSearchParams({ userId: resolvedUserId });
  return request<{ items: ItineraryItemRow[] }>(`/api/groups/${groupId}/itinerary?${params.toString()}`, { method: 'GET' });
}

export async function createItineraryItem(groupId: string, title: string, date: string, time?: string | null, userId?: string) {
  const resolvedUserId = await resolveActiveUserId(userId);
  return request<ItineraryItemRow>(`/api/groups/${groupId}/itinerary`, {
    method: 'POST',
    body: JSON.stringify({ userId: resolvedUserId, title, date, time: time ?? null }),
  });
}

export async function deleteItineraryItem(groupId: string, itemId: string, userId?: string) {
  const resolvedUserId = await resolveActiveUserId(userId);
  const params = new URLSearchParams({ userId: resolvedUserId });
  return fetch(`${base()}/api/groups/${groupId}/itinerary/${itemId}?${params.toString()}`, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json', 'x-app-env': APP_ENV },
  }).then(async (response) => {
    if (response.status === 204) return;
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.error ?? 'Delete failed');
  });
}
