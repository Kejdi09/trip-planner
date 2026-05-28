import { API_BASE_URL, APP_ENV } from './app-config';

export type FeedActivityType = 'review' | 'wishlist' | 'planned' | 'joined';

export type FeedActor = {
  id: string;
  fullName: string | null;
  username: string | null;
  avatarUrl: string | null;
};

export type FeedPlace = {
  id: string;
  title: string;
  city: string | null;
  country: string | null;
  imageUrl: string | null;
};

export type FeedItem = {
  id: string;
  type: FeedActivityType;
  actor: FeedActor;
  place: FeedPlace;
  rating: number | null;
  text: string | null;
  createdAt: string;
};

export async function fetchFriendActivityFeed({
  userId,
  limit = 20,
  offset = 0,
}: {
  userId: string;
  limit?: number;
  offset?: number;
}): Promise<FeedItem[]> {
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const params = new URLSearchParams({
    userId,
    limit: String(Math.max(1, Math.floor(limit))),
    offset: String(Math.max(0, Math.floor(offset))),
  });

  const response = await fetch(`${base}/reviews-api/feed?${params.toString()}`, {
    method: 'GET',
    headers: {
      'content-type': 'application/json',
      'x-app-env': APP_ENV,
    },
  });

  const payload = (await response.json().catch(() => ({}))) as { items?: FeedItem[]; error?: string };
  if (!response.ok) throw new Error(payload.error ?? 'Unable to load friend activity.');
  return payload.items ?? [];
}
