import { API_BASE_URL, APP_ENV } from './app-config';
import { supabase } from './supabase';

const base = () => (API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL);

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  content: string;
  is_read: boolean;
  created_at: string;
};

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) throw new Error('No authenticated user.');
  return data.user.id;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${base()}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-app-env': APP_ENV, ...(init?.headers ?? {}) },
  });
  if (!response.ok) throw new Error(`Notification request failed (${response.status})`);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function fetchNotifications(limit = 50) {
  const userId = await currentUserId();
  const params = new URLSearchParams({ userId, limit: String(limit) });
  const payload = await request<{ notifications: AppNotification[] }>(`/api/notifications?${params.toString()}`);
  return payload.notifications ?? [];
}

export async function fetchUnreadNotificationCount() {
  const notifications = await fetchNotifications(100);
  return notifications.filter((n) => !n.is_read).length;
}

export async function markNotificationRead(notificationId: string) {
  const userId = await currentUserId();
  return request<AppNotification>(`/api/notifications/${notificationId}/read`, { method: 'PATCH', body: JSON.stringify({ userId }) });
}

export async function markAllNotificationsRead() {
  const userId = await currentUserId();
  await request<void>(`/api/notifications/read-all`, { method: 'PATCH', body: JSON.stringify({ userId }) });
}

export async function fetchIncomingPendingRequestCount() {
  const userId = await currentUserId();
  const { count, error } = await supabase
    .from('friendships')
    .select('id', { count: 'exact', head: true })
    .eq('receiver_id', userId)
    .eq('status', 'pending');
  if (error) throw error;
  return count ?? 0;
}
