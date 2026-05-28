import { createAppNotification } from '../../../lib/notifications-api';
import { supabase } from '../../../lib/supabase';

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


async function createNotification(userId: string, type: string, title: string, body: string, relatedEntityType?: string, relatedEntityId?: string) {
  try {
    await createAppNotification({
      userId,
      type,
      title,
      body,
      relatedEntityType: relatedEntityType ?? null,
      relatedEntityId: relatedEntityId ?? null,
    });
  } catch (error) {
    console.warn('Failed to create notification:', error);
  }
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user?.id) throw new Error('No authenticated user.');
  return data.user.id;
}

export async function fetchIncomingFriendRequests(): Promise<FriendRequest[]> {
  const userId = await currentUserId();
  const { data, error } = await supabase
    .from('friendships')
    .select('id, requester_id')
    .eq('receiver_id', userId)
    .eq('status', 'pending');
  if (error) throw error;

  const requesterIds = (data ?? []).map((r) => r.requester_id);
  if (requesterIds.length === 0) return [];

  const { data: profiles, error: pErr } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .in('id', requesterIds);
  if (pErr) throw pErr;

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  return (data ?? []).map((r) => {
    const p = profileById.get(r.requester_id);
    return {
      id: r.id,
      senderId: r.requester_id,
      senderName: p?.full_name ?? p?.username ?? 'User',
      senderUsername: p?.username ?? 'user',
      senderAvatarUrl: p?.avatar_url ?? null,
    };
  });
}

export async function searchUsers(query: string): Promise<UserSearchResult[]> {
  const userId = await currentUserId();
  const term = query.trim();
  if (!term) return [];

  const { data: users, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, avatar_url')
    .or(`username.ilike.%${term}%,full_name.ilike.%${term}%`)
    .limit(30);
  if (error) throw error;

  const { data: relationships, error: relErr } = await supabase
    .from('friendships')
    .select('requester_id, receiver_id, status')
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);
  if (relErr) throw relErr;

  const sentOrConnected = new Set<string>();
  (relationships ?? []).forEach((f) => {
    const other = f.requester_id === userId ? f.receiver_id : f.requester_id;
    if (other) sentOrConnected.add(other);
  });

  return (users ?? [])
    .filter((u) => u.id !== userId)
    .map((u) => ({
      id: u.id,
      fullName: u.full_name ?? u.username ?? 'User',
      username: u.username ?? 'user',
      avatarUrl: u.avatar_url ?? null,
      requestSent: sentOrConnected.has(u.id),
    }));
}

export async function sendFriendRequest(receiverId: string): Promise<void> {
  const userId = await currentUserId();
  const { data: me } = await supabase.from('profiles').select('full_name, username').eq('id', userId).maybeSingle();
  const actorName = me?.full_name ?? me?.username ?? 'Unknown user';
  const { data, error } = await supabase.from('friendships').insert({ requester_id: userId, receiver_id: receiverId, status: 'pending' }).select('id').single();
  if (error) throw error;
  await createNotification(receiverId, 'friend_request_received', 'New friend request', `${actorName} sent you a friend request`, 'friend_request', data?.id);
}

export async function acceptFriendRequest(requestId: string): Promise<void> {
  const myId = await currentUserId();
  const { data: row } = await supabase.from('friendships').select('id, requester_id, receiver_id').eq('id', requestId).maybeSingle();
  const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', requestId);
  if (error) throw error;
  const { data: me } = await supabase.from('profiles').select('full_name, username').eq('id', myId).maybeSingle();
  const actorName = me?.full_name ?? me?.username ?? 'Unknown user';
  if (row?.requester_id) {
    await createNotification(row.requester_id, 'friend_request_accepted', 'Friend request accepted', `${actorName} accepted your friend request`, 'friend_request', requestId);
  }
}

export async function declineFriendRequest(requestId: string): Promise<void> {
  const { error } = await supabase.from('friendships').delete().eq('id', requestId);
  if (error) throw error;
}
