import { supabase } from './supabase';

export type AppNotification = {
  id: string;
  user_id: string;
  type: string;
  content: string | null;
  title: string | null;
  body: string | null;
  is_read: boolean;
  created_at: string;
};

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) throw new Error('No authenticated user.');
  return data.user.id;
}

export async function fetchNotifications(limit = 50): Promise<AppNotification[]> {
  try {
    const userId = await currentUserId();
    const { data, error } = await supabase
      .from('notifications')
      .select('id, user_id, type, content, title, body, is_read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.warn('Failed to fetch notifications:', error.message);
      return [];
    }

    return data ?? [];
  } catch (error) {
    console.warn('Failed to fetch notifications:', error);
    return [];
  }
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
  try {
    const userId = await currentUserId();
    const { data } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .eq('user_id', userId)
      .select('id, user_id, type, content, title, body, is_read, created_at')
      .maybeSingle();

    return data ?? null;
  } catch {
    return null;
  }
}

export async function markAllNotificationsRead() {
  try {
    const userId = await currentUserId();
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId).eq('is_read', false);
  } catch {
    // noop
  }
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
