import { API_BASE_URL, APP_ENV } from './app-config';
import { supabase } from './supabase';

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  content: string | null;
  title: string | null;
  body: string | null;
  related_entity_type: string | null;
  related_entity_id: string | null;
  is_read: boolean;
  created_at: string;
};

type NotificationPayload = { notifications?: AppNotification[]; error?: string };

type ErrorPayload = { error?: string };

function apiBaseUrl() {
  return API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) throw new Error('No authenticated user.');
  return data.user.id;
}

async function parseError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => ({}))) as ErrorPayload;
  return payload.error ?? fallback;
}


export async function createAppNotification({
  userId,
  type,
  title,
  body,
  relatedEntityType,
  relatedEntityId,
}: {
  userId: string;
  type: string;
  title: string;
  body: string;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}) {
  const response = await fetch(`${apiBaseUrl()}/notifications`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-app-env': APP_ENV },
    body: JSON.stringify({ userId, type, title, body, relatedEntityType: relatedEntityType ?? null, relatedEntityId: relatedEntityId ?? null }),
  });
  if (!response.ok) throw new Error(await parseError(response, 'Unable to create notification.'));
}

export async function fetchNotifications(limit = 50): Promise<AppNotification[]> {
  const userId = await currentUserId();
  const params = new URLSearchParams({ userId, limit: String(limit) });
  const response = await fetch(`${apiBaseUrl()}/notifications?${params.toString()}`, {
    method: 'GET',
    headers: { 'content-type': 'application/json', 'x-app-env': APP_ENV },
  });

  if (!response.ok) throw new Error(await parseError(response, 'Unable to load notifications.'));
  const payload = (await response.json()) as NotificationPayload;
  return payload.notifications ?? [];
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  try {
    const userId = await currentUserId();
    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) return 0;
    return count ?? 0;
  } catch {
    return 0;
  }
}

export async function markNotificationRead(notificationId: string) {
  const userId = await currentUserId();
  const response = await fetch(`${apiBaseUrl()}/notifications/${notificationId}/read`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', 'x-app-env': APP_ENV },
    body: JSON.stringify({ userId }),
  });

  if (!response.ok) return null;
  return (await response.json().catch(() => null)) as AppNotification | null;
}

export async function markAllNotificationsRead() {
  const userId = await currentUserId();
  await fetch(`${apiBaseUrl()}/notifications/read-all`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json', 'x-app-env': APP_ENV },
    body: JSON.stringify({ userId }),
  });
}

export async function deleteNotification(notificationId: string) {
  const userId = await currentUserId();
  const params = new URLSearchParams({ userId });
  const response = await fetch(`${apiBaseUrl()}/notifications/${notificationId}?${params.toString()}`, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json', 'x-app-env': APP_ENV },
  });
  if (!response.ok) throw new Error(await parseError(response, 'Unable to delete notification.'));
}

export async function clearNotifications() {
  const userId = await currentUserId();
  const params = new URLSearchParams({ userId });
  const response = await fetch(`${apiBaseUrl()}/notifications?${params.toString()}`, {
    method: 'DELETE',
    headers: { 'content-type': 'application/json', 'x-app-env': APP_ENV },
  });
  if (!response.ok) throw new Error(await parseError(response, 'Unable to clear notifications.'));
}

export async function registerPushToken(token: string, platform?: string | null) {
  const userId = await currentUserId();
  const response = await fetch(`${apiBaseUrl()}/notifications/push-token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-app-env': APP_ENV },
    body: JSON.stringify({ userId, token, platform: platform ?? null }),
  });
  if (!response.ok) throw new Error(await parseError(response, 'Unable to register push token.'));
}

export async function fetchIncomingPendingRequestCount() {
  try {
    const userId = await currentUserId();
    const { count } = await supabase
      .from('friendships')
      .select('id', { count: 'exact', head: true })
      .eq('receiver_id', userId)
      .eq('status', 'pending');
    return count ?? 0;
  } catch {
    return 0;
  }
}
